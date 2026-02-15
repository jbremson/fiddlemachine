import { SectionMode } from '../types/tune';

interface SectionSelectorProps {
  sectionMode: SectionMode;
  onSectionChange: (mode: SectionMode) => void;
  hasASections: boolean;
  hasBSections: boolean;
}

export function SectionSelector({
  sectionMode,
  onSectionChange,
  hasASections,
  hasBSections,
}: SectionSelectorProps) {
  return (
    <div className="section-selector">
      <span className="section-label">Section:</span>
      <div className="section-buttons">
        <button
          className={`section-btn ${sectionMode === 'full' ? 'active' : ''}`}
          onClick={() => onSectionChange('full')}
        >
          Full
        </button>
        <button
          className={`section-btn ${sectionMode === 'A' ? 'active' : ''}`}
          onClick={() => onSectionChange('A')}
          disabled={!hasASections}
        >
          A Part
        </button>
        <button
          className={`section-btn ${sectionMode === 'B' ? 'active' : ''}`}
          onClick={() => onSectionChange('B')}
          disabled={!hasBSections}
        >
          B Part
        </button>
      </div>
    </div>
  );
}
