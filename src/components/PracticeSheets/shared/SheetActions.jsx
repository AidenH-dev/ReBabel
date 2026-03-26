import { FaUndo } from 'react-icons/fa';
import { TbDownload, TbLoader } from 'react-icons/tb';
import Button from '@/components/ui/Button';

export default function SheetActions({ downloading, onDownload, onReset }) {
  return (
    <div className="grid grid-cols-2 gap-3">
      <button
        type="button"
        onClick={onDownload}
        disabled={downloading}
        className="flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-brand-pink to-[#c1084d] px-4 py-2 text-sm font-semibold text-white transition-all hover:brightness-110 hover:ring-2 hover:ring-brand-pink/40 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {downloading ? (
          <TbLoader className="text-base animate-spin" />
        ) : (
          <TbDownload className="text-base" />
        )}
        Download
      </button>
      <Button
        variant="pink-outline"
        size="md"
        onClick={onReset}
        className="gap-2"
      >
        <FaUndo />
        <span className="sm:hidden">Reset</span>
        <span className="hidden sm:inline">Reset sheet</span>
      </Button>
    </div>
  );
}
