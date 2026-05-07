const cache = new Map<string, Promise<string>>();

export function stripBlackBg(src: string, threshold = 30): Promise<string> {
  if (cache.has(src)) return cache.get(src)!;

  const p = new Promise<string>((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext("2d");
      if (!ctx) { reject(new Error("no 2d context")); return; }
      ctx.drawImage(img, 0, 0);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const { data } = imageData;
      for (let i = 0; i < data.length; i += 4) {
        if (data[i] + data[i + 1] + data[i + 2] < threshold) {
          data[i + 3] = 0;
        }
      }
      ctx.putImageData(imageData, 0, 0);
      canvas.toBlob(
        (blob) => resolve(blob ? URL.createObjectURL(blob) : canvas.toDataURL("image/png")),
        "image/png"
      );
    };
    img.onerror = () => reject(new Error(`stripBlackBg: failed to load ${src}`));
    img.src = src;
  });

  cache.set(src, p);
  return p;
}
