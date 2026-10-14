export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");

  if (req.method === "GET") {
    try {
      const r = await fetch(
        "https://raw.githubusercontent.com/nexus989mn-svg/Portif-lio-De-Apresenta-o-/main/portfolio-settings.json"
      );
      if (!r.ok) return res.status(200).json({ items: [], autoColors: false });
      return res.status(200).json(await r.json());
    } catch {
      return res.status(200).json({ items: [], autoColors: false });
    }
  }

  if (req.method !== "POST") {
    res.setHeader("Allow", "GET, POST");
    return res.status(405).json({ error: "Método não permitido." });
  }

  const secret = req.headers["x-admin-secret"];
  if (!process.env.ADMIN_SECRET || secret !== process.env.ADMIN_SECRET) {
    return res.status(401).json({ error: "Chave administrativa inválida." });
  }

  const token = process.env.GITHUB_TOKEN;
  if (!token) {
    return res.status(500).json({ error: "Configure GITHUB_TOKEN na Vercel." });
  }

  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
    if (!body || !Array.isArray(body.items)) {
      return res.status(400).json({ error: "Dados inválidos." });
    }

    const items = [];

    for (const item of body.items) {
      const key = String(item.key || "").replace(/[^a-z0-9-]/gi, "").slice(0, 40);
      if (!key) continue;

      let image = String(item.image || "");

      if (image.startsWith("data:image/")) {
        const match = image.match(
          /^data:(image\/(?:png|jpeg|webp));base64,([A-Za-z0-9+/=]+)$/
        );
        if (!match) {
          return res.status(400).json({ error: "Use imagens PNG, JPG ou WebP." });
        }

        const ext = { "image/png": "png", "image/jpeg": "jpg", "image/webp": "webp" }[match[1]];
        const path = `uploads/${key}.${ext}`;

        const upload = await githubPut(path, match[2], `Atualiza imagem ${key}`, token);
        if (!upload.ok) {
          return res.status(502).json({
            error: "Erro ao enviar imagem ao GitHub.",
            detail: (await upload.text()).slice(0, 250)
          });
        }

        image = path;
      }

      if (image && !image.startsWith("uploads/") &&
          !/^https:\/\/|^[a-z0-9_.\/-]+$/i.test(image)) {
        return res.status(400).json({ error: "Caminho de imagem inválido." });
      }

      items.push({
        key,
        name: String(item.name || key).slice(0, 80),
        image
      });
    }

    const settings = JSON.stringify({
      items,
      autoColors: body.autoColors === true,
      updatedAt: new Date().toISOString()
    }, null, 2);

    const saved = await githubPut(
      "portfolio-settings.json",
      Buffer.from(settings).toString("base64"),
      "Publica configurações do portfólio",
      token
    );

    if (!saved.ok) {
      return res.status(502).json({
        error: "Erro ao salvar configurações.",
        detail: (await saved.text()).slice(0, 250)
      });
    }

    return res.status(200).json({
      ok: true,
      message: "Alterações salvas no GitHub. Aguarde a publicação da Vercel."
    });
  } catch (e) {
    return res.status(500).json({
      error: "Falha ao publicar.",
      detail: String(e.message || e).slice(0, 250)
    });
  }
}

async function githubPut(path, content, message, token) {
  const url = `https://api.github.com/repos/nexus989mn-svg/Portif-lio-De-Apresenta-o-/contents/${path}`;
  const headers = {
    Authorization: `Bearer ${token}`,
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    "Content-Type": "application/json"
  };

  const current = await fetch(url, { headers });
  let sha;
  if (current.ok) sha = (await current.json()).sha;
  else if (current.status !== 404) return current;

  return fetch(url, {
    method: "PUT",
    headers,
    body: JSON.stringify({
      message,
      content,
      branch: "main",
      ...(sha ? { sha } : {})
    })
  });
}
