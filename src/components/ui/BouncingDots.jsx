const keyframes = `
@keyframes bd-circle {
  0% {
    top: 60px;
    height: 5px;
    border-radius: 50px 50px 25px 25px;
    transform: scaleX(1.7);
  }
  40% {
    height: 20px;
    border-radius: 50%;
    transform: scaleX(1);
  }
  100% {
    top: 0%;
  }
}

@keyframes bd-shadow {
  0% {
    transform: scaleX(1.5);
  }
  40% {
    transform: scaleX(1);
    opacity: 0.7;
  }
  100% {
    transform: scaleX(0.2);
    opacity: 0.4;
  }
}
`;

const positions = [
  { left: '10%', delay: '0s' },
  { left: '40%', delay: '0.2s' },
  { left: '70%', delay: '0.3s' },
];

export default function BouncingDots({ scale = 1 }) {
  return (
    <>
      <style>{keyframes}</style>
      <div
        style={{
          width: 200 * scale,
          height: 80 * scale,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div
          style={{
            width: 200,
            height: 80,
            position: 'relative',
            zIndex: 1,
            transform: `scale(${scale})`,
            transformOrigin: 'center center',
          }}
        >
          {positions.map((pos, i) => (
            <div
              key={`dot-${i}`}
              style={{
                width: 20,
                height: 20,
                position: 'absolute',
                borderRadius: '50%',
                backgroundColor: 'var(--brand-pink)',
                left: pos.left,
                transformOrigin: '50%',
                animation: 'bd-circle 0.5s alternate infinite ease',
                animationDelay: pos.delay,
              }}
            />
          ))}
          {positions.map((pos, i) => (
            <div
              key={`shadow-${i}`}
              style={{
                width: 20,
                height: 4,
                borderRadius: '50%',
                backgroundColor: 'var(--bd-shadow, rgba(0,0,0,0.15))',
                position: 'absolute',
                top: 62,
                transformOrigin: '50%',
                zIndex: -1,
                left: pos.left,
                filter: 'blur(1px)',
                animation: 'bd-shadow 0.5s alternate infinite ease',
                animationDelay: pos.delay,
              }}
            />
          ))}
        </div>
      </div>
    </>
  );
}
