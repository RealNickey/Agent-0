# Voice Activity Detection (VAD) Testing Guide

This project streams microphone audio to Gemini Live. The model performs automatic voice activity detection (VAD). We now augment that with lightweight client‑side silence detection to explicitly flush segments when the user stops speaking.

## Summary of Changes

- Continuous PCM16 (16kHz) microphone audio is sent via `client.sendRealtimeInput`.
- When local volume stays below a threshold (default `0.005`) for > `1000ms`, the client calls `client.endAudioStream()` which sends `{ audioStreamEnd: true }`.
- Server VAD still operates normally; this just accelerates turn finalization after pauses.
- VAD thresholds are configurable via `ControlTray` props.

## Configuration

`ControlTray` now accepts two optional props:

```tsx
<ControlTray
  videoRef={videoRef}
  supportsVideo
  vadSilenceMs={1200} // ms of silence before we signal end (default 1000)
  vadMinVolume={0.004} // below this treated as silence (default 0.005)
/>
```

## New Client API

`GenAILiveClient.endAudioStream()` – Emits `audioStreamEnd` to flush cached server audio.

## Internal Logic (Simplified)

1. Mic PCM chunk received -> forwarded to model.
2. Volume worklet updates current RMS proxy.
3. If volume >= threshold → mark speech active and update `lastSpeechTime`.
4. A periodic (250ms) check looks for `now - lastSpeechTime > vadSilenceMs` while in speech; if true → send `audioStreamEnd` and reset speech state.
5. Next non‑silent chunk resumes implicit streaming.

## Rationale

- Reduces latency between a natural pause and model response.
- Provides resilience if model's internal VAD buffers slightly longer.
- Keeps implementation minimal and non‑intrusive.

## Tuning Guidance

| Parameter      | Effect                             | Trade‑off                                 |
| -------------- | ---------------------------------- | ----------------------------------------- |
| `vadMinVolume` | Lower catches softer speech sooner | Too low treats background noise as speech |
| `vadSilenceMs` | Longer avoids premature cuts       | Increases response latency                |

Start with defaults and adjust only if you see either: (a) responses triggering too late (decrease `vadSilenceMs`) or (b) model cutting off mid‑thought (increase `vadSilenceMs`).

## Potential Future Enhancements

- Adaptive noise floor estimation and dynamic thresholding.
- Separate start/stop (hysteresis) thresholds.
- UI markers showing detected segment boundaries.
- Optional per‑segment local buffering to drop very short noises.

## Testing Checklist

1. Speak a short sentence and pause. Response should begin ~1s after you stop.
2. Speak with brief pauses between clauses (<1s). Stream should NOT flush mid‑phrase.
3. Whisper or speak softly: ensure speech still counted (raise volume or lower `vadMinVolume` if missed).
4. Stay silent after connecting: no `audioStreamEnd` should fire repeatedly (only after an initial speech segment ends).
5. Mute microphone: any active segment should end within the silence window.

## Debugging

Add temporary logs around `endAudioStream()` to confirm segmentation:

```ts
console.debug("VAD: sending audioStreamEnd at", Date.now());
```

If segments never end:

- Verify `volume` values in DevTools.
- Lower `vadMinVolume` (e.g. 0.002).
- Confirm audio worklet is emitting volume events (no console errors).

If segments end too aggressively:

- Increase `vadSilenceMs` to 1500–1800.
- Increase `vadMinVolume` slightly.

---

This guide reflects the current implementation state after adding client‑assisted VAD segmentation.
