import { BskyAgent } from '@atproto/api';
import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import 'dotenv/config';

const agent = new BskyAgent({ service: 'https://bsky.social' });

async function postDailyClairo() {
  try {
    // Cargar o inicializar el estado 
    const stateFile = './state.json';
    let state = { currentIndex: 0 };

    if (fs.existsSync(stateFile)) {
      state = JSON.parse(fs.readFileSync(stateFile, 'utf-8'));
    }

    await agent.login({
      identifier: process.env.BSKY_HANDLE,
      password: process.env.BSKY_PASSWORD
    });

    // Leer carpeta y filtrar solo imágenes válidas
    const fotosDir = './fotos';
    let archivos = fs.readdirSync(fotosDir);
    archivos = archivos.filter(file => 
      ['.jpg', '.jpeg', '.png'].includes(path.extname(file).toLowerCase())
    );

    if (archivos.length === 0) {
      console.log('No hay fotos en la carpeta.');
      return;
    }

    // Ordenar naturalmente
    archivos.sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }));

    // Validar si ya se recorrieron todas las fotos
    if (state.currentIndex >= archivos.length) {
      console.log('¡Se terminaron todas las fotos! Reiniciando el contador a 0.');
      state.currentIndex = 0;
    }

    // Seleccionar foto que toca hoy
    const fotoDeHoy = archivos[state.currentIndex];
    const rutaFoto = path.join(fotosDir, fotoDeHoy);
    const imageBuffer = fs.readFileSync(rutaFoto);

    // Comprimir la imagen
    const imageBuffer = await sharp(originalBuffer)
      .resize({ width: 2000, withoutEnlargement: true }) // Evitar que exceda los 2000px de ancho
      .jpeg({ quality: 80 }) // Comprimir y estandarizar todo a formato JPEG
      .toBuffer();

    const mimeType = 'image/jpeg';

    // Subir y publicar
    const { data } = await agent.uploadBlob(imageBuffer, { encoding: mimeType });

    await agent.post({
      text: '',
      createdAt: new Date().toISOString(),
      embed: {
        $type: 'app.bsky.embed.images',
        images: [{ image: data.blob, alt: 'clairoooooo' }]
      }
    });

    console.log(`Publicado con éxito: ${fotoDeHoy}`);

    // Guardar el progreso para el día siguiente
    state.currentIndex += 1;
    fs.writeFileSync(stateFile, JSON.stringify(state, null, 2));

  } catch (error) {
    console.error('Error en el proceso:', error);
  }
}

postDailyClairo();