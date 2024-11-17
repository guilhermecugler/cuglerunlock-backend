const express = require('express');
const puppeteer = require('puppeteer');
const fs = require('fs');
const cors = require('cors');

const router = express.Router();
const SESSION_PATH = './session.json'; // Caminho para o arquivo de sessão

// Função que realiza o login e salva a sessão
async function login() {
  const browser = await puppeteer.launch({
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    headless: true
  });
  const page = await browser.newPage();

  let isLoggedIn = false;

  // Verifica se já existe uma sessão salva
  if (fs.existsSync(SESSION_PATH)) {
    const sessionData = fs.readFileSync(SESSION_PATH);
    const cookies = JSON.parse(sessionData);
    // Restaura a sessão usando os cookies salvos
    await page.setCookie(...cookies);
    console.log('Sessão carregada.');

    // Verifica se a sessão está realmente logada
    await page.goto('https://unlocktrue.com/main/lgin/success');
    const title = await page.title();
    if (title === 'Client Area Dashboard') {
      isLoggedIn = true;
      console.log('Está logado com sucesso');

      // Aguarda o seletor estar disponível
      const tokenElement = await page.waitForSelector('#token');

      // Obtém o valor do input
      const tokenValue = await tokenElement.evaluate(el => el.value);

      console.log('Token:', tokenValue);
    } else {
      console.log('Sessão expirada ou inválida, realizando o login...');
    }
  } else {
    console.log('Sem sessão salva, realizando o login...');
  }

  // Se não estiver logado, faz o login
  if (!isLoggedIn) {
    console.log('Realizando login...');
    await page.goto('https://unlocktrue.com/');

    // Realiza a requisição de login via API
    await page.evaluate(async () => {
      await fetch('https://unlocktrue.com/widget/save/login', {
        method: 'POST',
        body: new URLSearchParams([
          ['username', 'mauriciocugler'],
          ['password', 'Mauricio.1'],
          ['trust_device', '1'],
          ['pass[]', ''],
          ['pass[]', ''],
          ['pass[]', ''],
          ['pass[]', ''],
          ['pass[]', ''],
          ['pass[]', ''],
          ['secotp', '']
        ])
      });
    });

    // Aguarda o carregamento da página de sucesso
    await page.goto('https://unlocktrue.com/main/lgin/success');
    const title = await page.title();

    if (title === 'Client Area Dashboard') {
      console.log('Logado com sucesso');
      isLoggedIn = true;

      // Salva os cookies para a próxima sessão
      const cookies = await page.cookies();
      fs.writeFileSync(SESSION_PATH, JSON.stringify(cookies));
    } else {
      console.log('Falha ao logar');
    }
  }

  // Aguarda o seletor estar disponível
  const tokenElement = await page.waitForSelector('#token');

  // Obtém o valor do input
  const tokenValue = await tokenElement.evaluate(el => el.value);

  console.log('Token:', tokenValue);

  // Retorna o navegador e página para uso posterior
  return { browser, page, isLoggedIn, tokenValue };
}

// Função separada para extrair os dados do select
async function extractSelectData(page, url) {
  await page.goto(url);

  // Extrai os dados do select
  const options = await page.evaluate(() => {
    const selectElement = document.querySelector('#service_id'); // O ID do select
    const optionElements = selectElement.querySelectorAll('option');

    const data = [];

    optionElements.forEach(option => {
      const value = option.value;
      let price = option.getAttribute('data-price'); // Pegue o preço
      const text = option.textContent.trim();

      if (value && price && text) {
        data.push({ value, price, text });
      }
    });

    const mdmFix = data.findIndex(item => item.value === '7f141cf8e7136ce8701dc6636c2a6fe4');
    if (mdmFix !== -1) {
      data[mdmFix].price = '100'; // Modifica o preço para 25
      const specialItem = data.splice(mdmFix, 1)[0]; // Remove o item
      data.unshift(specialItem); // Coloca o item no início
    }

    const unlockTool = data.findIndex(item => item.value === '370bfb31abd222b582245b977ea5f25a');
    if (unlockTool !== -1) {
      data[unlockTool].price = '25'; // Modifica o preço para 25
      const specialItem = data.splice(unlockTool, 1)[0]; // Remove o item
      data.unshift(specialItem); // Coloca o item no início
    }

    return data;
  });

  return options;
}

// Rota para obter as ferramentas
router.get('/getTools', async (req, res) => {
  try {
    const { browser, page, isLoggedIn, tokenValue } = await login();

    if (!isLoggedIn) {
      res.status(401).json({ success: false, message: 'Falha ao obter os dados, verifique o login' });
      return;
    }

    // Após login, chama a função para extrair os dados do select
    const data = await extractSelectData(page, 'https://unlocktrue.com/resellerplaceorder/remote');
    res.json({
      success: true,
      data: data
    });

    // Fecha o navegador após a execução
    await browser.close();
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Erro no servidor' });
  }
});

module.exports = router;
