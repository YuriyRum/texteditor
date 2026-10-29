# Standalone RichTextEmailEditor Package Guide

This repository contains a dedicated build pipeline to compile **RichTextEmailEditor** as an independent, standalone npm-ready library that can be integrated into any React application (Vite, Next.js, Remix, Create React App, etc.).

---

## 🚀 1. Building the Standalone Library

Run the standalone build script:

```bash
npm run build:standalone
```

### What This Generates:
The build command executes Vite's Library mode and TypeScript declaration generator (`tsc -p tsconfig.lib.json`), creating the `dist/standalone/` folder containing:

- **`rich-text-email-editor.js`** (ES Module format for Vite, Next.js ESM, Webpack 5)
- **`rich-text-email-editor.cjs`** (CommonJS format for Node / older bundlers)
- **`rich-text-email-editor.css`** (Compiled styles: Tailwind utilities, ProseMirror canvas, tables, resizable images)
- **`types/`** (Full TypeScript `.d.ts` declaration files for complete autocomplete and type safety)

---

## 📦 2. Adding to Another App

### Option A: Install from local path
In your other app's `package.json`, you can directly install this folder:

```bash
# From your other app's root directory:
npm install ../path-to-this-repo/dist/standalone
# Or with yarn:
yarn add ../path-to-this-repo/dist/standalone
# Or with pnpm:
pnpm add ../path-to-this-repo/dist/standalone
```

### Option B: Pack into a `.tgz` archive
```bash
# In this repo's root:
npm pack
# Then in your other app:
npm install ../path-to-this-repo/rich-text-email-editor-0.0.0.tgz
```

### Option C: Publish to npm or GitHub Packages
```bash
npm publish --access public
```

---

## 💻 3. Usage in Any React Application

```tsx
import React, { useState } from 'react';
import { 
  RichTextEmailEditor, 
  RichTextEmailEditorChangeData,
  TemplateImageObject 
} from 'rich-text-email-editor';

// 1. Import the compiled stylesheet (includes editor styling and table borders)
import 'rich-text-email-editor/style.css';

export default function MyEmailPage() {
  const [content, setContent] = useState<RichTextEmailEditorChangeData>({
    html: '<p>Hello from standalone editor!</p>',
    text: 'Hello from standalone editor!',
    cidHtml: '<p>Hello from standalone editor!</p>',
    images: [],
    outlookHtml: '',
  });

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', height: 600 }}>
      <RichTextEmailEditor
        value={content.html}
        images={content.images}
        placeholder="Compose message..."
        onChange={(data) => {
          console.log('Visual HTML:', data.html);
          console.log('Outlook CID HTML:', data.cidHtml);
          console.log('Extracted Images:', data.images);
          setContent(data);
        }}
      />
    </div>
  );
}
```

---

## ✉️ 4. Outlook CID Compatibility

When integrating with Microsoft Outlook or backend mailers (Nodemailer, SendGrid, Amazon SES, C# MailMessage):

1. `data.cidHtml` replaces inline `data:...` base64 images with `src="cid:filename.png@outlook.embed"`.
2. `data.images` provides an array of `{ cid, name, dataUrl, contentType, size }`.
3. Pass `cidHtml` as the email body and attach each item in `data.images` as an inline MIME attachment matching the `Content-ID` header.
4. If you load an email back into the editor with `cid:` images, pass both `value={cidHtml}` and `images={imagesArray}`—the editor will automatically reconstruct the visual images in the browser!
