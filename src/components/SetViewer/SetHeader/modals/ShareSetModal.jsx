import { FiCopy, FiCheck } from 'react-icons/fi';
import { TbShare2, TbLoader3 } from 'react-icons/tb';
import dynamic from 'next/dynamic';
import BaseModal from '@/components/ui/BaseModal';

const QRCode = dynamic(
  () => import('react-qrcode-logo').then((mod) => mod.QRCode),
  { ssr: false }
);

export default function ShareSetModal({
  isOpen,
  shareUrl,
  shareToken,
  shareExpiresAt,
  shareExpiry,
  shareError,
  isGeneratingShare,
  showShareResult,
  copied,
  codeCopied,
  isRevokingShare,
  onCopyShareUrl,
  onCopyCode,
  onRegenerateWithExpiry,
  onRevokeShare,
  onClose,
}) {
  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      size="md"
      title={
        <>
          <TbShare2 className="w-5 h-5 text-brand-pink inline mr-2" />
          Share Set
        </>
      }
      subtitle="Anyone with the link can preview and import this set"
    >
      <div className="px-6 py-5">
        {!shareUrl && !isGeneratingShare && shareError ? (
          <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-800 dark:text-red-200 text-sm">
            <strong>Error:</strong> {shareError}
          </div>
        ) : shareUrl || isGeneratingShare ? (
          <div className="space-y-5">
            {/* QR Code / generating animation */}
            <div className="flex flex-col items-center">
              <div className="w-[176px] h-[176px] rounded-2xl overflow-hidden relative flex items-center justify-center">
                {isGeneratingShare ? (
                  <>
                    <style
                      dangerouslySetInnerHTML={{
                        __html: `
                          @keyframes dotFlux {
                            0% { transform: scale(0.4); opacity: 0.25; }
                            30% { transform: scale(1); opacity: 0.9; }
                            55% { transform: scale(0.5); opacity: 0.3; }
                            80% { transform: scale(0.9); opacity: 0.8; }
                            100% { transform: scale(0.4); opacity: 0.25; }
                          }
                          @keyframes shimmerSlide {
                            0% { transform: translateX(-100%); }
                            100% { transform: translateX(100%); }
                          }
                          @keyframes finderPulse {
                            0%, 100% { opacity: 0.4; }
                            50% { opacity: 0.8; }
                          }
                        `,
                      }}
                    />
                    <div className="absolute inset-0">
                      {/* Corner finder patterns */}
                      {(() => {
                        const isDark =
                          document.documentElement.classList.contains('dark');
                        const finderColor = isDark
                          ? 'rgba(255,255,255,0.25)'
                          : 'rgba(0,0,0,0.18)';
                        const finderStyle = {
                          position: 'absolute',
                          width: 30,
                          height: 30,
                          borderRadius: 6,
                          border: `3px solid ${finderColor}`,
                          animation: 'finderPulse 2s ease-in-out infinite',
                        };
                        const innerStyle = {
                          position: 'absolute',
                          top: '50%',
                          left: '50%',
                          transform: 'translate(-50%, -50%)',
                          width: 13,
                          height: 13,
                          borderRadius: 3,
                          backgroundColor: finderColor,
                        };
                        return (
                          <>
                            <div style={{ ...finderStyle, top: 4, left: 4 }}>
                              <div style={innerStyle} />
                            </div>
                            <div
                              style={{
                                ...finderStyle,
                                top: 4,
                                right: 4,
                                animationDelay: '0.3s',
                              }}
                            >
                              <div style={innerStyle} />
                            </div>
                            <div
                              style={{
                                ...finderStyle,
                                bottom: 4,
                                left: 4,
                                animationDelay: '0.6s',
                              }}
                            >
                              <div style={innerStyle} />
                            </div>
                          </>
                        );
                      })()}
                      {/* Center logo */}
                      <div
                        style={{
                          position: 'absolute',
                          top: '50%',
                          left: '50%',
                          transform: 'translate(-50%, -50%)',
                          width: 42,
                          height: 42,
                          borderRadius: '50%',
                          backgroundColor: 'transparent',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          zIndex: 2,
                        }}
                      >
                        <img
                          src="/ReBabelIcon.png"
                          alt=""
                          style={{
                            width: 30,
                            height: 25,
                            objectFit: 'contain',
                          }}
                        />
                      </div>
                      {/* Dot grid */}
                      <div
                        style={{
                          display: 'grid',
                          gridTemplateColumns: 'repeat(23, 1fr)',
                          gap: 1,
                          width: '100%',
                          height: '100%',
                          padding: 4,
                        }}
                      >
                        {Array.from({ length: 529 }).map((_, i) => {
                          const row = Math.floor(i / 23);
                          const col = i % 23;
                          const inTopLeft = row < 5 && col < 5;
                          const inTopRight = row < 5 && col > 17;
                          const inBottomLeft = row > 17 && col < 5;
                          // Skip dots behind center logo
                          const inCenter =
                            row >= 9 && row <= 13 && col >= 9 && col <= 13;
                          if (
                            inTopLeft ||
                            inTopRight ||
                            inBottomLeft ||
                            inCenter
                          )
                            return <div key={i} />;
                          const isDark =
                            document.documentElement.classList.contains('dark');
                          // Loosely grouped — nearby dots nudged toward similar timing but with heavy randomness
                          const groupRow = Math.floor(row / 4);
                          const groupCol = Math.floor(col / 4);
                          const groupNudge =
                            ((groupRow * 3 + groupCol) * 0.17) % 1;
                          const duration = 1.8 + Math.random() * 1.4; // 1.8-3.2s, mostly random
                          // Negative delay = start mid-animation, so dots are already in random states on mount
                          const delay = -(
                            Math.random() * duration * 0.7 +
                            groupNudge * 0.6
                          );
                          return (
                            <div
                              key={i}
                              style={{
                                width: '100%',
                                aspectRatio: '1',
                                borderRadius: '50%',
                                backgroundColor: isDark
                                  ? 'rgba(255,255,255,0.12)'
                                  : 'rgba(0,0,0,0.08)',
                                animation: `dotFlux ${duration}s ease-in-out infinite`,
                                animationDelay: `${delay}s`,
                              }}
                            />
                          );
                        })}
                      </div>
                    </div>
                  </>
                ) : showShareResult && shareUrl ? (
                  <QRCode
                    value={shareUrl}
                    size={160}
                    bgColor="transparent"
                    fgColor={
                      document.documentElement.classList.contains('dark')
                        ? '#e5e7eb'
                        : '#1f2937'
                    }
                    qrStyle="dots"
                    eyeRadius={8}
                    logoImage="/ReBabelIcon.png"
                    logoWidth={34}
                    logoHeight={29}
                    logoPaddingStyle="circle"
                    logoPadding={4}
                    removeQrCodeBehindLogo
                    quietZone={8}
                  />
                ) : null}
              </div>
              <p className="mt-2 text-xs font-fredoka h-4">
                {isGeneratingShare ? (
                  <span className="text-brand-pink dark:text-brand-pink-hover">
                    Generating link...
                  </span>
                ) : showShareResult ? (
                  <span className="text-gray-400 dark:text-gray-500">
                    Scan to preview this set
                  </span>
                ) : null}
              </p>
            </div>

            {/* Link + copy */}
            <div className="flex gap-2 items-center h-9">
              {isGeneratingShare ? (
                <div
                  className="flex-1 h-full rounded-lg border border-gray-200/50 dark:border-gray-700/50 overflow-hidden relative"
                  style={{
                    backgroundColor:
                      document.documentElement.classList.contains('dark')
                        ? 'rgba(255,255,255,0.02)'
                        : 'rgba(0,0,0,0.02)',
                  }}
                >
                  <div
                    className="absolute inset-0"
                    style={{
                      background: document.documentElement.classList.contains(
                        'dark'
                      )
                        ? 'linear-gradient(90deg, transparent, rgba(255,255,255,0.06), transparent)'
                        : 'linear-gradient(90deg, transparent, rgba(0,0,0,0.04), transparent)',
                      animation: 'shimmerSlide 1.5s ease-in-out infinite',
                    }}
                  />
                </div>
              ) : showShareResult ? (
                <>
                  <input
                    type="text"
                    readOnly
                    value={shareUrl}
                    className="flex-1 h-full px-2 py-1.5 bg-surface-deep border border-gray-200 dark:border-gray-700 rounded-lg text-[7px] leading-tight text-gray-900 dark:text-white font-mono break-all"
                    onClick={(e) => e.target.select()}
                  />
                  <button
                    onClick={onCopyShareUrl}
                    className={`p-2 rounded-lg transition-colors flex-shrink-0 ${
                      copied
                        ? 'text-green-500 bg-green-50 dark:bg-green-900/20'
                        : 'text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800'
                    }`}
                    title={copied ? 'Copied!' : 'Copy link'}
                  >
                    {copied ? (
                      <FiCheck className="w-4.5 h-4.5" />
                    ) : (
                      <FiCopy className="w-4.5 h-4.5" />
                    )}
                  </button>
                </>
              ) : null}
            </div>

            {/* Import code */}
            {showShareResult && shareToken && (
              <div className="bg-surface-deep border border-gray-200 dark:border-gray-700 rounded-lg p-3">
                <label className="block text-[10px] font-medium text-gray-500 dark:text-gray-400 mb-2">
                  Import code
                </label>
                <div className="flex items-center gap-2">
                  <code className="flex-1 text-center text-2xl font-bold font-mono tracking-[0.3em] text-gray-900 dark:text-white select-all">
                    {shareToken}
                  </code>
                  <button
                    onClick={onCopyCode}
                    className={`p-2 rounded-lg transition-colors flex-shrink-0 ${
                      codeCopied
                        ? 'text-green-500 bg-green-50 dark:bg-green-900/20'
                        : 'text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800'
                    }`}
                    title={codeCopied ? 'Copied!' : 'Copy code'}
                  >
                    {codeCopied ? (
                      <FiCheck className="w-4 h-4" />
                    ) : (
                      <FiCopy className="w-4 h-4" />
                    )}
                  </button>
                </div>
                <p className="text-[9px] text-gray-400 dark:text-gray-500 mt-1.5 text-center">
                  Share this code for quick import
                </p>
              </div>
            )}

            {/* Expiration -- always visible */}
            <div>
              <label className="block text-[10px] font-medium text-gray-500 dark:text-gray-400 mb-1.5">
                Link expires
                {shareExpiresAt && !isGeneratingShare && (
                  <span className="ml-1 font-normal text-gray-400 dark:text-gray-500">
                    —{' '}
                    {new Date(shareExpiresAt).toLocaleDateString(undefined, {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </span>
                )}
                {!shareExpiresAt &&
                  shareExpiry === 'never' &&
                  !isGeneratingShare && (
                    <span className="ml-1 font-normal text-gray-400 dark:text-gray-500">
                      — never
                    </span>
                  )}
              </label>
              <div className="flex gap-1.5">
                {[
                  { value: '1d', label: '1 day' },
                  { value: '7d', label: '7 days' },
                  { value: '30d', label: '30 days' },
                  { value: 'never', label: 'Never' },
                ].map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => {
                      if (opt.value !== shareExpiry) {
                        onRegenerateWithExpiry(opt.value);
                      }
                    }}
                    disabled={isGeneratingShare}
                    className={`px-2.5 py-1 text-[10px] font-medium rounded-md transition-colors disabled:opacity-50 ${
                      shareExpiry === opt.value
                        ? 'bg-brand-pink text-white'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={onRevokeShare}
                disabled={isRevokingShare || isGeneratingShare}
                className="text-sm text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 transition-colors disabled:opacity-50 flex items-center gap-1.5"
              >
                {isRevokingShare ? (
                  <>
                    <TbLoader3 className="w-3.5 h-3.5 animate-spin" />
                    Revoking...
                  </>
                ) : (
                  'Stop Sharing'
                )}
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </BaseModal>
  );
}
