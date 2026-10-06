// Exibe o escudo fornecido pelo usuario (public/escudo.webp).
// E apenas uma referencia ao arquivo de imagem colocado no projeto.
export default function Crest({ size = 46 }) {
  return (
    <img
      className="crest"
      src="/escudo.webp"
      width={size}
      height={size}
      alt="Escudo do time"
      style={{ objectFit: 'contain', display: 'block' }}
    />
  );
}
