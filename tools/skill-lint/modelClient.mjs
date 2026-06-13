/**
 * modelClient.mjs — minimal OpenAI-compatible /v1/chat/completions client for the
 * behavioral eval. Reads the endpoint + key + model id from env (wired from repo
 * secrets in CI). No SDK dependency — one fetch. Works against any
 * OpenAI-compatible gateway (the platform's, Ollama's /v1, a hosted model, etc.).
 *
 *   MODEL_API_BASE   e.g. https://gateway.example/v1   (no trailing /chat/completions)
 *   MODEL_API_KEY    bearer token (may be empty for keyless local gateways)
 *   MODEL_ID         e.g. the capable model the linter judges with
 *
 * SPDX-License-Identifier: Apache-2.0
 */

export function modelConfigFromEnv() {
  const base = process.env.MODEL_API_BASE;
  const id = process.env.MODEL_ID;
  if (!base || !id) {
    throw new Error('behavioral eval requires MODEL_API_BASE and MODEL_ID (set from repo secrets)');
  }
  return { base: base.replace(/\/+$/, ''), key: process.env.MODEL_API_KEY || '', id };
}

/**
 * @param {{base:string,key:string,id:string}} cfg
 * @param {{system:string,user:string,temperature?:number,maxTokens?:number,timeoutMs?:number}} req
 * @returns {Promise<string>} the assistant message content
 */
export async function chatComplete(cfg, req) {
  const { system, user, temperature = 0.7, maxTokens = 4096, timeoutMs = 120000 } = req;
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(`${cfg.base}/chat/completions`, {
      method: 'POST',
      signal: ctrl.signal,
      headers: {
        'content-type': 'application/json',
        ...(cfg.key ? { authorization: `Bearer ${cfg.key}` } : {}),
      },
      body: JSON.stringify({
        model: cfg.id,
        temperature,
        max_tokens: maxTokens,
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: user },
        ],
      }),
    });
    if (!res.ok) {
      const body = await res.text().catch(() => '');
      throw new Error(`model endpoint ${res.status}: ${body.slice(0, 300)}`);
    }
    const json = await res.json();
    const content = json?.choices?.[0]?.message?.content;
    if (typeof content !== 'string') throw new Error('model response had no message content');
    return content;
  } finally {
    clearTimeout(t);
  }
}
