// Saves one check-in through the steps at #/check-in (issue #29), for the feature-doc shot scripts.
// fields: { heartRate, spo2, sleep, kss, mood }; a missing field is left empty and passed with "Next →".
export async function saveCheckIn(page, fields = {}) {
  const next = (waitMs = 250) => page.click('.check-in button[type=submit]', waitMs)
  await page.evaluate(`location.hash = '#/check-in'`)
  await page.sleep(400)
  for (const name of ['heartRate', 'spo2', 'sleep']) {
    if (fields[name] !== undefined) await page.fill(`input[name=${name}]`, fields[name])
    await next()
  }
  for (const name of ['kss', 'mood']) {
    if (fields[name] !== undefined) await page.click(`.scale li:nth-child(${fields[name]}) button`, 100)
    await next()
  }
  await next(800) // "Save check-in" on the symptoms step
  await page.click('.check-in-complete .button-primary', 400) // "Done" on the completion (#40)
}
