import fs from 'fs';
import path from 'path';

const configPath = path.join(process.env.USERPROFILE || process.env.HOME, '.openclaw', 'openclaw.json');

async function runBenchmark() {
  if (!fs.existsSync(configPath)) {
    console.error(`Config not found at ${configPath}`);
    return;
  }

  const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  const providers = config.models.providers;
  
  console.log('🚀 Iniciando Test de Velocidad (NVIDIA NIM)...');
  console.log('-------------------------------------------');

  const results = [];

  for (const [providerId, provider] of Object.entries(providers)) {
    if (!providerId.startsWith('nvidia-')) continue;

    const model = provider.models[0];
    const modelId = model.id;
    const apiKey = provider.apiKey;
    const baseUrl = provider.baseUrl;

    console.log(`Testing ${providerId.padEnd(20)} (${modelId})...`);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000); // 15s timeout

    const start = Date.now();
    try {
      const response = await fetch(`${baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: modelId,
          messages: [{ role: 'user', content: 'Ready' }],
          max_tokens: 5,
          temperature: 0.1
        }),
        signal: controller.signal
      });

      clearTimeout(timeout);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      await response.json();
      const duration = Date.now() - start;
      console.log(`-> ${duration}ms ✅`);
      results.push({ name: providerId, model: modelId, duration, status: '✅ OK' });
    } catch (error) {
      clearTimeout(timeout);
      const msg = error.name === 'AbortError' ? 'Timeout (15s)' : error.message;
      console.log(`-> ❌ ${msg}`);
      results.push({ name: providerId, model: modelId, duration: Infinity, status: `❌ ${msg}` });
    }
  }

  console.log('\n📊 RANKING DE VELOCIDAD:');
  const sorted = results.filter(r => r.duration !== Infinity).sort((a, b) => a.duration - b.duration);
  sorted.forEach((r, i) => {
    console.log(`${i + 1}. ${r.name.padEnd(20)}: ${r.duration}ms`);
  });
  
  const winner = sorted[0];
  if (winner) {
    console.log(`\n🏆 EL GANADOR ES: ${winner.name} con ${winner.duration}ms`);
  } else {
    console.log('\n⚠️ Ningún modelo respondió a tiempo.');
  }
}

runBenchmark();
