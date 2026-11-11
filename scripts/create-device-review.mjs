// Temporary local-only review page. Vite's production entry never imports it.
import { writeFileSync } from 'node:fs';
writeFileSync('device-review.html', `<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><title>Earned Self device review</title></head><body style="font:18px system-ui;max-width:600px;margin:40px auto;padding:24px"><h1>Wallpaper device review</h1><p>This resets only this browser's local demo data. It does not access an account or Supabase.</p><button id="start">Load ceramics example in Professional</button><p id="message"></p><script type="module">
import { applyLocal } from '/src/data/domain.ts';
import { emptySnapshot } from '/src/data/types.ts';
import { foundation } from '/tests/fixtures.ts';
const message = document.querySelector('#message');
if (!__LOCAL_PREVIEW__) {
  document.querySelector('#start').disabled = true;
  message.textContent = 'Start with npm run preview:local. This fixture cannot run in production mode.';
} else {
  document.querySelector('#start').onclick = () => {
    const owner = 'local-preview-member';
    const store = applyLocal({snapshot:emptySnapshot(), receipts:{}}, {
      actorId:owner, operationId:crypto.randomUUID(), kind:'goal',
      payload:{...foundation, id:'device-ceramics', area:'professional'}
    }, owner).store;
    localStorage.setItem('earned-self:LOCAL-PREVIEW-ONLY:personal:v1', JSON.stringify(store));
    localStorage.setItem('earned-self:LOCAL-PREVIEW-ONLY:session', 'yes');
    location.href = '/wallpaper/device-ceramics';
  };
}
</script></body></html>`);
console.log('Temporary device-review.html created. Use the same HTTPS URL in each phone browser and tap Load ceramics example. Remove this file after review.');
