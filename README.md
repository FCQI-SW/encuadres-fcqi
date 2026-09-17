## Documentacion

La documentacion tecnica del proyecto se encuentra en:

[`/docs`](./docs)

Dentro de esa carpeta se incluye la documentacion general del sistema, la documentacion completa de la base de datos y un archivo SQL de referencia con la estructura observada en Supabase.


This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.



## Variables de entorno

Para ejecutar el proyecto es necesario crear un archivo .env.local en la raiz.

El repositorio incluye .env.example como referencia de las variables necesarias. Los valores reales no se incluyen en Git porque contienen credenciales del proyecto.

1. Copiar .env.example.
2. Renombrar la copia como .env.local.
3. Completar los valores correspondientes.

Variables utilizadas:

- NEXT_PUBLIC_SUPABASE_URL: URL de la instancia de Supabase.
- NEXT_PUBLIC_SUPABASE_ANON_KEY: clave publica utilizada por el cliente de Supabase.
- SUPABASE_SERVICE_ROLE_KEY: clave administrativa utilizada solamente desde codigo del servidor.
- NEXTAUTH_SECRET: secreto utilizado para firmar y proteger la sesion de NextAuth.

SUPABASE_SERVICE_ROLE_KEY no debe utilizarse en componentes cliente ni exponerse mediante variables con el prefijo NEXT_PUBLIC_.

NODE_ENV tambien es utilizado por el proyecto, pero normalmente es definido automaticamente por Next.js y no necesita agregarse a .env.local.
