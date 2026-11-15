#!/usr/bin/env bash
# HTTPS certificate for the Vite dev server (`npm run dev:https`): the demo iPad only gives the page a microphone
# (voice, F25) over HTTPS. Makes a local CA once, then a server certificate for localhost, this Mac's .local name
# and every IPv4 address it has right now.
# Re-run after the Mac's IP changes (new Wi-Fi) and restart the dev server: the CA stays, so the iPad keeps trusting it.
# Extra names or IPs: tools/dev-cert.sh demo-mac 192.168.1.20
set -euo pipefail

dir="${HOME}/.config/crew-health/dev-certs"
host="$(scutil --get LocalHostName 2>/dev/null || hostname -s)"
mkdir -p "$dir"
cd "$dir"

new_ca=false
if [[ ! -f ca.pem || ! -f ca-key.pem ]]; then
  openssl req -x509 -quiet -newkey rsa:2048 -nodes -sha256 -days 3650 \
    -keyout ca-key.pem -out ca.pem -subj "/CN=Crew Health dev CA (${host})" \
    -addext "basicConstraints=critical,CA:TRUE" \
    -addext "keyUsage=critical,keyCertSign,cRLSign"
  chmod 600 ca-key.pem
  new_ca=true
fi

san="DNS:localhost,DNS:${host}.local,IP:127.0.0.1"
for ip in $(ifconfig | awk '/inet / && $2 != "127.0.0.1" {print $2}'); do san+=",IP:${ip}"; done
for extra in "$@"; do
  if [[ "$extra" =~ ^[0-9.]+$ ]]; then san+=",IP:${extra}"; else san+=",DNS:${extra}"; fi
done

# iOS accepts a server certificate only with a subjectAltName, serverAuth and at most 825 days of validity.
openssl req -new -quiet -newkey rsa:2048 -nodes -keyout dev-key.pem -out dev.csr -subj "/CN=${host}.local"
openssl x509 -req -in dev.csr -CA ca.pem -CAkey ca-key.pem -sha256 -days 800 -out dev.pem -extfile <(printf '%s\n' \
  "basicConstraints=CA:FALSE" \
  "keyUsage=critical,digitalSignature,keyEncipherment" \
  "extendedKeyUsage=serverAuth" \
  "subjectKeyIdentifier=hash" \
  "authorityKeyIdentifier=keyid" \
  "subjectAltName=${san}") 2>/dev/null
rm -f dev.csr
chmod 600 dev-key.pem

lan_ip="$(ipconfig getifaddr en0 2>/dev/null || ipconfig getifaddr en1 2>/dev/null || echo '<Mac IP>')"
echo "Server certificate: ${dir}/dev.pem"
echo "  valid for ${san//,/ }"
echo
if $new_ca; then
  echo "New CA, trust it on the iPad once:"
else
  echo "Same CA as before (${dir}/ca.pem). If the iPad doesn't trust it yet:"
fi
echo "  1. AirDrop ${dir}/ca.pem to the iPad, then Settings > Profile Downloaded > Install."
echo "  2. Settings > General > About > Certificate Trust Settings: turn on \"Crew Health dev CA (${host})\"."
echo
echo "Then: cd src/main/frontend && npm run dev:https, and open https://${lan_ip}:5173 on the iPad."
if $new_ca && command -v open >/dev/null; then open -R ca.pem; fi
