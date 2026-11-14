# #22 Personal Health Gateway: oximeter SpO₂ over MQTT

A simulated finger oximeter can now feed the crew app. The Personal Health Gateway (F9) listens on the local MQTT broker (`crew/a1/oximeter`), checks each message and stores it as a FHIR-shaped `Observation`, offline, beside the manual check-ins. The newest reading wins across sources: SpO₂ drives the Respiratory status and both the SpO₂ and Heart rate tiles, labelled `oximeter · synthetic` (or `replay`, `proxy`), and Home and the Respiratory detail update the moment a reading arrives. Issue [#22](https://github.com/jdo-lv/galagans/issues/22); features F9 and build-order step 1 in [features.md](../../ideas/features.md).

**Try it:** start the broker (`docker run -it --name crew-broker -p 1883:1883 -p 9001:9001 -v "$PWD/tools/mosquitto:/mosquitto/config" eclipse-mosquitto`), then `mvn clean verify` and `mvn spring-boot:run`, open http://localhost:8080 and publish a reading:

```bash
docker exec crew-broker mosquitto_pub -t crew/a1/oximeter \
  -m "{\"id\":\"$(uuidgen)\",\"t\":\"$(date -u +%Y-%m-%dT%H:%M:%SZ)\",\"spo2_pct\":91,\"pulse_bpm\":61,\"src\":\"synthetic\"}"
```

The app connects to `VITE_MQTT_URL` (default `ws://localhost:9001`) and works without a broker. **Retake the screenshot** with the app and broker running: `target/node/node docs/features/22-phg-oximeter.shots.mjs` ([script](22-phg-oximeter.shots.mjs)); set `CONTAINER_CLI=podman` if you use Podman. The script publishes through the real broker, so the screenshot shows the full path.

## Screens

### Home, oximeter SpO₂ 91 %, pulse 61 bpm (`src: synthetic`), published while Home was open
Respiratory, the figure's Lungs and the SpO₂ tile show ▲ CAUTION (rule SPO-01); the row, the SpO₂ tile and the Heart rate tile carry the `oximeter · synthetic` source tag.
![Home with an oximeter reading](img/22-home-oximeter.png)

## Mockup and deviations

Follows [01-body-map.png](../../ideas/mockups/01-body-map.png); there's no new UI element or layout change, only source label text, refresh timing and the Cardiovascular placeholder text.

- The Cardiovascular placeholder reads `BP 108/70 · synthetic` (was `HR 63 bpm · BP 108/70`), because heart rate is now a real reading on its own tile.
- At this width the `oximeter · synthetic` tag wraps onto two lines inside a tile. The tag style is unchanged from the guidelines; the label is just longer than `manual`.
- There's no broker connection indicator (out of scope). A missing broker is silent.
