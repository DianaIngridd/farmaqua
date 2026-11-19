const express = require('express');
const path = require('path');
const multer = require('multer');
const PDFDocument = require('pdfkit');
const mongoose = require('mongoose');

// Importações dos modelos da pasta models
const Usuario = require('./models/Usuario');
const Meta = require('./models/Meta');
const Leitura = require('./models/Leitura');
const Fatura = require('./models/Fatura');
const { calcularConsumoLitros, parsePeriodo } = require('./utils/calculos');

const app = express();

// =========================================================================
// CONEXÃO COM O BANCO DE DADOS (MONGODB)
// A string de conexão vem da variável de ambiente MONGODB_URI (nunca no código).
// A conexão só é aberta quando o arquivo é executado diretamente (node server.js),
// permitindo que os testes importem o `app` sem tocar no banco de produção.
// =========================================================================
function conectarBanco() {
    const mongoURI = process.env.MONGODB_URI;
    if (!mongoURI) {
        console.error('❌ Defina a variável de ambiente MONGODB_URI antes de iniciar o servidor.');
        process.exit(1);
    }
    return mongoose.connect(mongoURI)
        .then(() => console.log('🌿 Conectado com sucesso ao MongoDB'))
        .catch(err => console.error('❌ Erro crítico ao conectar ao MongoDB:', err));
}

// =========================================================================
// CONFIGURAÇÕES DO SERVIDOR
// =========================================================================
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join(__dirname, 'public', 'img'));
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});
const upload = multer({ storage: storage });

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'front')));
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'front', 'teladelogin.html'));
});

// =========================================================================
// ROTAS
// =========================================================================

// ROTA 1: Login
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'teladelogin.html'));
});

// ROTA 2: Autenticação
app.post('/Auth/Login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const usuario = await Usuario.findOne({ email: email.toLowerCase().trim() });

        if (usuario && usuario.senha === password) {
            const nivelAcesso = usuario.role.trim().toLowerCase();
            res.redirect(`/dashboarddeconsumo.html?role=${nivelAcesso}`);
        } else {
            res.redirect('/?error=true');
        }
    } catch (error) {
        res.status(500).send('Erro interno.');
    }
});

// ROTA 3: Lançamento Hidrômetro
app.post('/Leitura/Salvar', upload.single('fotoEvidencia'), async (req, res) => {
    try {
        const { unidadId, dataLeitura, valorM3, tipoAtividade, descricaoOutro } = req.body;
        const fotoSalva = req.file ? req.file.filename : "Nenhuma foto enviada";

        const valorAtualM3 = parseFloat(valorM3);
        const dataAtual = new Date(dataLeitura);

        const leituraAnterior = await Leitura.findOne({
            dataLeitura: { $lt: dataAtual }
        }).sort({ dataLeitura: -1 });

        const consumoLitros = calcularConsumoLitros(valorAtualM3, leituraAnterior);

        await Leitura.create({
            unidadeId: unidadId || 'Principal',
            dataLeitura: dataAtual,
            valorM3: valorAtualM3,
            consumoLiters: consumoLitros,
            tipoAtividade: tipoAtividade ? tipoAtividade.toUpperCase() : 'NORMAL',
            descricaoOutro: descricaoOutro || '',
            fotoEvidencia: fotoSalva
        });

        const role = req.query.role || 'func';
        res.redirect(`/hidrometro.html?role=${role}&sucesso=true`);
    } catch (error) {
        console.error("Erro ao salvar:", error);
        res.status(500).send('Erro ao salvar leitura.');
    }
});

// ROTA: Editar leitura (atualiza valorM3 e recalcula consumo)
app.put('/api/leituras/:id', async (req, res) => {
    try {
        const { novoValorM3, dataLeitura, tipoAtividade, descricaoOutro } = req.body;
        const valorAtualM3 = parseFloat(novoValorM3);

        const leituraAtual = await Leitura.findById(req.params.id);
        if (!leituraAtual) return res.status(404).send("Leitura não encontrada.");

        const dataAtual = dataLeitura ? new Date(dataLeitura) : leituraAtual.dataLeitura;

        const leituraAnterior = await Leitura.findOne({
            _id: { $ne: req.params.id },
            dataLeitura: { $lt: dataAtual }
        }).sort({ dataLeitura: -1 });

        const consumoLitros = calcularConsumoLitros(valorAtualM3, leituraAnterior);

        await Leitura.findByIdAndUpdate(req.params.id, {
            valorM3: valorAtualM3,
            consumoLiters: consumoLitros,
            dataLeitura: dataAtual,
            tipoAtividade: tipoAtividade ? tipoAtividade.toUpperCase() : leituraAtual.tipoAtividade,
            descricaoOutro: descricaoOutro !== undefined ? descricaoOutro : leituraAtual.descricaoOutro
        });

        res.sendStatus(200);
    } catch (error) {
        console.error("Erro ao atualizar:", error);
        res.status(500).send("Erro ao atualizar.");
    }
});

// ROTA: Excluir leitura
app.delete('/api/leituras/:id', async (req, res) => {
    try {
        const resultado = await Leitura.findByIdAndDelete(req.params.id);
        if (!resultado) return res.status(404).send("Leitura não encontrada.");
        res.sendStatus(200);
    } catch (error) {
        console.error("Erro ao excluir:", error);
        res.status(500).send("Erro ao excluir leitura.");
    }
});

// ROTA: Vínculo de Fatura Copasa
app.post('/Financeiro/VincularFatura', upload.single('arquivoFatura'), async (req, res) => {
    try {
        const { valorFatura } = req.body;
        const documentoSalvo = req.file ? req.file.filename : "Nenhum PDF anexado";

        await Fatura.create({
            valorFatura: parseFloat(valorFatura),
            arquivoUrl: documentoSalvo,
            dataReferencia: new Date(),
            status: 'PAGO'
        });

        console.log(`💰 FATURA PERSISTIDA NO ATLAS: R$ ${valorFatura}`);
        res.redirect('/relatorios.html?role=admin&faturaSalva=true');
    } catch (error) {
        console.error('Erro ao salvar fatura:', error);
        res.status(500).send('Erro interno ao processar fatura.');
    }
});

// ROTA: Resumo Financeiro
app.get('/api/Financeiro/Resumo', async (req, res) => {
    try {
        const leituras = await Leitura.find().sort({ dataLeitura: -1 });
        const valorTarifaM3 = 8.50;
        const totalM3 = leituras.reduce((acc, curr) => acc + curr.valorM3, 0);
        const custoAcumulado = totalM3 * valorTarifaM3;
        const previsaoFechamento = custoAcumulado * 1.2;

        res.json({
            custoAcumulado: custoAcumulado.toFixed(2),
            previsaoFechamento: previsaoFechamento.toFixed(2),
            tarifa: valorTarifaM3.toFixed(2),
            economia: {
                e5: (previsaoFechamento * 0.05).toFixed(2),
                e10: (previsaoFechamento * 0.10).toFixed(2),
                e20: (previsaoFechamento * 0.20).toFixed(2)
            }
        });
    } catch (error) {
        res.status(500).json({ erro: 'Erro ao calcular dados financeiros' });
    }
});

// ROTA: Dados de Metas
app.get('/api/Metas/Dados', async (req, res) => {
    try {
        const meta = await Meta.findOne().sort({ createdAt: -1 }) || { limiteM3: 15 };
        const leituras = await Leitura.find().sort({ dataLeitura: 1 });

        res.json({
            meta: meta,
            historico: {
                meses: leituras.map(l => new Date(l.dataLeitura).toLocaleDateString('pt-BR', { month: 'short' })),
                consumoReal: leituras.map(l => l.consumoLiters !== undefined && l.consumoLiters !== null ? l.consumoLiters : 0),
                metasDefinidas: leituras.map(() => meta.limiteM3)
            }
        });
    } catch (error) {
        res.status(500).json({ error: "Erro ao buscar dados." });
    }
});

// ROTA: Buscar todas as leituras
app.get('/api/leituras', async (req, res) => {
    try {
        const leituras = await Leitura.find().sort({ dataLeitura: 1 });
        res.json(leituras);
    } catch (error) {
        res.status(500).json({ error: "Erro ao buscar leituras." });
    }
});

// ROTA: Configurar Metas
app.post('/Metas/Configurar', async (req, res) => {
    try {
        const { mesReferencia, limiteM3, emailAlerta } = req.body;
        await Meta.findOneAndUpdate(
            { mesReferencia },
            { limiteM3, emailAlerta },
            { upsert: true, new: true }
        );
        res.redirect('/metas.html?role=admin&salvo=true');
    } catch (error) {
        res.status(500).send('Erro ao salvar meta.');
    }
});

// ROTA: Resolver Alerta
app.post('/Alerta/Resolver', async (req, res) => {
    try {
        const { causa, acoes, resolvido } = req.body;
        console.log(`🛠️ Relatório Técnico Recebido: Causa ${causa} - Ações: ${acoes}`);
        res.sendStatus(200);
    } catch (error) {
        res.status(500).send('Erro ao salvar relatório.');
    }
});

// ROTA: Gerar Relatório PDF para download
app.post('/Relatorios/Gerar', async (req, res) => {
    try {
        const { tipoRelatorio, formato, dataInicio, dataFim } = req.body;

        const { inicio, fim } = parsePeriodo(dataInicio, dataFim);

        const leituras = await Leitura.find({
            dataLeitura: { $gte: inicio, $lte: fim }
        }).sort({ dataLeitura: 1 });

        const meta = await Meta.findOne().sort({ createdAt: -1 });
        const limiteM3 = meta ? meta.limiteM3 : 15;
        const valorTarifaM3 = 8.50;

        const doc = new PDFDocument({ margin: 40 });

        const nomeArquivo = `Farmaqua_${tipoRelatorio}_${dataInicio || 'geral'}_${dataFim || 'geral'}.pdf`;
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${nomeArquivo}"`);
        doc.pipe(res);

        // Cabeçalho
        doc.fontSize(20).fillColor('#0077b6').text('FARMAQUA - Relatório de Consumo Hídrico', { align: 'center' });
        doc.moveDown(0.5);
        doc.fontSize(11).fillColor('#555').text(`Período: ${dataInicio || 'Início'} a ${dataFim || 'Fim'}`, { align: 'center' });
        doc.fontSize(10).text(`Tipo: ${tipoRelatorio.toUpperCase()} | Gerado em: ${new Date().toLocaleDateString('pt-BR')}`, { align: 'center' });
        doc.moveDown(1);

        // Linha separadora
        doc.moveTo(40, doc.y).lineTo(555, doc.y).strokeColor('#0077b6').lineWidth(1.5).stroke();
        doc.moveDown(1);

        // CORREÇÃO DO CUSTO: Soma o consumo real em litros e converte para m³ antes de calcular o preço
        const totalConsumoLitros = leituras.reduce((acc, l) => acc + (l.consumoLiters || 0), 0);
        const consumoTotalM3 = totalConsumoLitros / 1000; 
        const custoTotal = consumoTotalM3 * valorTarifaM3;

        // Resumo Geral
        doc.fontSize(13).fillColor('#0077b6').text('Resumo Geral', { underline: true });
        doc.moveDown(0.3);
        doc.fontSize(10).fillColor('#222');
        doc.text(`Total de Leituras: ${leituras.length}`);
        doc.text(`Consumo Total Acumulado: ${totalConsumoLitros.toFixed(0)} Litros`);
        doc.text(`Custo Estimado: R$ ${custoTotal.toFixed(2)}`); // Agora vai exibir o valor correto!
        doc.text(`Meta Configurada: ${limiteM3} m³`);
        doc.moveDown(1);

        // Tabela de leituras
        doc.fontSize(13).fillColor('#0077b6').text('Histórico de Leituras', { underline: true });
        doc.moveDown(0.5);

        // CORREÇÃO DO LAYOUT: Ajuste nos eixos X para dar mais espaço e evitar textos cortados
        const colX = [40, 110, 185, 260, 340, 455];
        const headers = ['Data', 'Valor (m³)', 'Consumo (L)', 'Tipo', 'Desc. Extra', 'Situação'];

        // Desenha o cabeçalho da tabela
        const currentY = doc.y;
        doc.rect(40, currentY, 515, 18).fill('#0077b6');
        
        doc.fontSize(9).fillColor('#fff');
        headers.forEach((h, i) => {
            doc.text(h, colX[i], currentY + 4, { 
                width: colX[i + 1] ? colX[i + 1] - colX[i] - 5 : 555 - colX[i],
                ellipsis: true 
            });
        });
        
        // Espaçamento após o cabeçalho
        doc.y = currentY + 22;

        // Renderiza as linhas dos dados
        leituras.forEach((l, idx) => {
            if (doc.y > 700) { 
                doc.addPage(); 
                // Reimprime o cabeçalho na nova página se estourar o limite
                const newY = doc.y;
                doc.rect(40, newY, 515, 18).fill('#0077b6');
                doc.fontSize(9).fillColor('#fff');
                headers.forEach((h, i) => doc.text(h, colX[i], newY + 4));
                doc.y = newY + 22;
            }

            const rowY = doc.y;
            const bg = idx % 2 === 0 ? '#f4f9fc' : '#ffffff';
            doc.rect(40, rowY, 515, 18).fill(bg);
            
            const consumo = l.consumoLiters || 0;
            const situacao = consumo > (limiteM3 * 1000) ? 'Acima da Meta' : 'Normal';
            
            const rowData = [
                new Date(l.dataLeitura).toLocaleDateString('pt-BR'),
                l.valorM3.toFixed(3),
                consumo.toFixed(0),
                l.tipoAtividade || 'NORMAL',
                l.descricaoOutro ? l.descricaoOutro.substring(0, 15) : '-',
                situacao
            ];

            doc.fontSize(8).fillColor('#222');
            rowData.forEach((d, i) => {
                doc.text(d, colX[i], rowY + 4, { 
                    width: colX[i + 1] ? colX[i + 1] - colX[i] - 5 : 555 - colX[i],
                    ellipsis: true
                });
            });
            
            doc.y = rowY + 18; // Move para a próxima linha perfeitamente
        });

        doc.moveDown(2);
        doc.fontSize(8).fillColor('#aaa').text('Farmaqua © 2026 - Sistema de Monitoramento de Consumo Hídrico', { align: 'center' });

        doc.end();
    } catch (error) {
        console.error('Erro ao gerar PDF:', error);
        res.status(500).send('Erro ao gerar relatório.');
    }
});

// ROTA: Cadastro de Usuários
app.post('/Usuarios/Cadastrar', async (req, res) => {
    try {
        const { nome, email, role, senha } = req.body;

        await Usuario.findOneAndUpdate(
            { email: email.toLowerCase().trim() },
            {
                nome: nome.trim(),
                role: role.trim().toLowerCase(),
                senha: senha
            },
            { upsert: true, new: true }
        );

        console.log(`👤 USUÁRIO SALVO NO ATLAS: ${nome} (${role})`);
        res.redirect('/cadastrousuario.html?role=admin&sucesso=true');
    } catch (error) {
        console.error('❌ Erro ao cadastrar usuário:', error);
        res.status(500).send('Erro interno ao salvar as credenciais.');
    }
});

const PORT = process.env.PORT || 3000;

// Só conecta ao banco e abre a porta quando executado diretamente (node server.js).
if (require.main === module) {
    conectarBanco();
    app.listen(PORT, () => {
        console.log(`Servidor do Farmaqua rodando na porta ${PORT}! 💧`);
    });
}

module.exports = app;
