import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { QRCodeSVG } from 'qrcode.react';

export default function EtiquetasImpresion({ libros, onClose }) {
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    const handler = () => onCloseRef.current();
    const timer = setTimeout(() => window.print(), 50);
    window.addEventListener('afterprint', handler);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('afterprint', handler);
    };
  }, []);

  return createPortal(
    <div id="etiquetas-print">
      <style>{`
        @media print {
          @page { size: A4 portrait; margin: 0; }
          body > *:not(#etiquetas-print) { display: none !important; }
          #etiquetas-print { display: flex !important; }
          body, #etiquetas-print, .etiqueta { background: white !important; }
        }
        #etiquetas-print {
          display: none;
          flex-wrap: wrap;
          width: 210mm;
          align-content: flex-start;
          background: white;
        }
        .etiqueta {
          width: 52.5mm;
          height: 37mm;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          box-sizing: border-box;
          padding: 1mm;
          gap: 0.5mm;
          overflow: hidden;
          background: white;
        }
        .etiqueta-codigo {
          font-size: 5.5pt;
          font-family: monospace;
          color: #ffffff00;
          text-align: center;
          line-height: 1;
        }
        .etiqueta-qr svg {
          width: 24mm !important;
          height: 24mm !important;
          display: block;
        }
        .etiqueta-texto {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.3mm;
          width: 100%;
          overflow: hidden;
        }
        .etiqueta-titulo {
          font-size: 6pt;
          font-weight: medium;
          color: #000000;
          line-height: 1.2;
          overflow: hidden;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          word-break: break-word;
          text-align: center;
          width: 100%;
        }
        .etiqueta-estanteria {
          font-size: 5.5pt;
          color: #6c6c6c;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          text-align: center;
          width: 100%;
        }
      `}</style>
      {libros.map((libro) => (
        <div key={libro.id} className="etiqueta">
          <span className="etiqueta-codigo">{libro.codigo}</span>
          <div className="etiqueta-qr">
            <QRCodeSVG value={libro.codigo} size={91} />
          </div>
          <div className="etiqueta-texto">
            <div className="etiqueta-titulo">{libro.titulo}</div>
            {libro.estanteria && (
              <div className="etiqueta-estanteria">{libro.estanteria}</div>
            )}
          </div>
        </div>
      ))}
    </div>,
    document.body
  );
}
