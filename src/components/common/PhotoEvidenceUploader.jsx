import { useState } from 'react';
import { Camera, Upload, Trash2, Eye, Plus, Sparkles, X } from 'lucide-react';

// Preset sample photos for immediate testing
const PRESET_EVIDENCE_PHOTOS = [
  {
    id: 'photo_brake_disc',
    title: 'Cracked Front Brake Disc & Worn Pad',
    caption: 'Deep scoring and hairline heat crack on left drive axle rotor',
    // SVG Data URI for realistic graphic depiction of truck brake assembly
    url: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300' viewBox='0 0 400 300'%3E%3Crect width='400' height='300' fill='%231e293b'/%3E%3Ccircle cx='200' cy='150' r='100' fill='none' stroke='%2364748b' stroke-width='30' stroke-dasharray='15 5'/%3E%3Ccircle cx='200' cy='150' r='60' fill='%23334155' stroke='%23ef4444' stroke-width='4'/%3E%3Cpath d='M160 80 L190 140' stroke='%23ef4444' stroke-width='3'/%3E%3Ctext x='200' y='270' font-family='sans-serif' font-size='14' font-weight='bold' fill='%23f87171' text-anchor='middle'%3EFAULT: Rotor Crack & Brake Pad %3C 3mm%3C/text%3E%3C/svg%3E",
  },
  {
    id: 'photo_oil_leak',
    title: 'Engine Oil Pan Gasket Leak',
    caption: 'Active oil seepage near flywheel housing & oil sump plug',
    url: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300' viewBox='0 0 400 300'%3E%3Crect width='400' height='300' fill='%231e293b'/%3E%3Crect x='100' y='80' width='200' height='120' rx='10' fill='%23334155' stroke='%2394a3b8' stroke-width='4'/%3E%3Cellipse cx='200' cy='220' rx='60' ry='15' fill='%23eab308' opacity='0.7'/%3E%3Cpath d='M180 180 Q190 200 200 215' stroke='%23eab308' stroke-width='5' fill='none'/%3E%3Ctext x='200' y='270' font-family='sans-serif' font-size='14' font-weight='bold' fill='%23facc15' text-anchor='middle'%3EFAULT: Engine Oil Sump Gasket Leak%3C/text%3E%3C/svg%3E",
  },
  {
    id: 'photo_tire_tread',
    title: 'Drive Axle Tire Tread Delamination',
    caption: 'Tread depth worn to 1.8mm with shoulder uneven scrubbing',
    url: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300' viewBox='0 0 400 300'%3E%3Crect width='400' height='300' fill='%231e293b'/%3E%3Crect x='120' y='40' width='160' height='200' rx='20' fill='%230f172a' stroke='%23475569' stroke-width='8'/%3E%3Cpath d='M140 70 L260 70 M140 110 L260 110 M140 150 L260 150 M140 190 L260 190' stroke='%23ef4444' stroke-width='6' stroke-dasharray='10 15'/%3E%3Ctext x='200' y='270' font-family='sans-serif' font-size='14' font-weight='bold' fill='%23f87171' text-anchor='middle'%3EFAULT: Tire Tread Under Legal Limit (1.8mm)%3C/text%3E%3C/svg%3E",
  },
  {
    id: 'photo_coolant_hose',
    title: 'Radiator Hose Split & Coolant Spray',
    caption: 'Upper radiator hose bulging with green coolant residue',
    url: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300' viewBox='0 0 400 300'%3E%3Crect width='400' height='300' fill='%231e293b'/%3E%3Cpath d='M80 150 Q200 80 320 150' fill='none' stroke='%23334155' stroke-width='32' stroke-linecap='round'/%3E%3Cpath d='M180 120 L220 125' stroke='%2322c55e' stroke-width='8'/%3E%3Ccircle cx='200' cy='122' r='18' fill='%2322c55e' opacity='0.4'/%3E%3Ctext x='200' y='270' font-family='sans-serif' font-size='14' font-weight='bold' fill='%234ade80' text-anchor='middle'%3EFAULT: Radiator Hose Bulge & Coolant Loss%3C/text%3E%3C/svg%3E",
  },
];

export default function PhotoEvidenceUploader({ photos = [], onChange, readOnly = false }) {
  const [selectedImage, setSelectedImage] = useState(null);
  const [showPresets, setShowPresets] = useState(false);

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    files.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const newPhoto = {
          id: 'photo_' + Math.random().toString(36).substr(2, 9),
          url: reader.result,
          title: file.name,
          caption: 'Evidence photograph of mechanical fault',
          uploadedAt: new Date().toISOString(),
        };
        const updated = [...(photos || []), newPhoto];
        onChange?.(updated);
      };
      reader.readAsDataURL(file);
    });
  };

  const addPresetPhoto = (preset) => {
    const newPhoto = {
      id: 'photo_' + Math.random().toString(36).substr(2, 9),
      url: preset.url,
      title: preset.title,
      caption: preset.caption,
      uploadedAt: new Date().toISOString(),
    };
    onChange?.([...(photos || []), newPhoto]);
    setShowPresets(false);
  };

  const removePhoto = (photoId) => {
    const updated = (photos || []).filter(p => p.id !== photoId);
    onChange?.(updated);
  };

  const updateCaption = (photoId, newCaption) => {
    const updated = (photos || []).map(p => p.id === photoId ? { ...p, caption: newCaption } : p);
    onChange?.(updated);
  };

  return (
    <div className="rounded-xl border border-outline-variant/30 bg-surface-container-lowest p-4 transition-all">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
            <Camera size={17} />
          </div>
          <div>
            <h4 className="text-sm font-bold text-teal-950 dark:text-teal-50">Evidence Photographs</h4>
            <p className="text-[11px] text-on-surface-variant">Attach photos of damaged parts, fluid leaks, or dashboard warning lights</p>
          </div>
        </div>

        {!readOnly && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowPresets(!showPresets)}
              className="text-xs font-bold px-2.5 py-1 rounded-lg border border-lime-500/40 bg-lime-50 text-teal-950 dark:bg-lime-950/30 dark:text-lime-300 hover:bg-lime-100 flex items-center gap-1 transition-all"
            >
              <Sparkles size={13} />
              <span>Sample Photos</span>
            </button>
            <label className="text-xs font-bold px-3 py-1.5 rounded-lg bg-primary text-white hover:bg-teal-900 cursor-pointer flex items-center gap-1.5 transition-all shadow-sm">
              <Plus size={14} />
              <span>Add Photo</span>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleFileChange}
                className="hidden"
              />
            </label>
          </div>
        )}
      </div>

      {/* Preset Photo Picker Modal / Tray */}
      {showPresets && (
        <div className="mb-4 p-3 rounded-xl bg-teal-50 dark:bg-teal-950/70 border border-teal-200 dark:border-teal-800 space-y-2 animate-in fade-in">
          <div className="flex justify-between items-center">
            <p className="text-xs font-bold text-teal-900 dark:text-teal-100">Click to attach realistic truck inspection sample:</p>
            <button type="button" onClick={() => setShowPresets(false)} className="text-teal-600 hover:text-teal-800">
              <X size={15} />
            </button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {PRESET_EVIDENCE_PHOTOS.map(preset => (
              <div
                key={preset.id}
                onClick={() => addPresetPhoto(preset)}
                className="group relative rounded-lg border border-teal-200 dark:border-teal-800 overflow-hidden cursor-pointer hover:border-lime-500 hover:shadow-md transition-all bg-white dark:bg-teal-900"
              >
                <img src={preset.url} alt={preset.title} className="w-full h-20 object-cover group-hover:scale-105 transition-transform" />
                <div className="p-1.5 text-[11px] font-bold text-teal-950 dark:text-teal-50 line-clamp-1">{preset.title}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Gallery of Uploaded Photos */}
      {photos && photos.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {photos.map((photo, idx) => (
            <div
              key={photo.id || idx}
              className="group relative rounded-xl border border-outline-variant/40 bg-slate-50 dark:bg-teal-950/50 overflow-hidden flex flex-col shadow-xs"
            >
              <div className="relative h-36 w-full bg-slate-900 overflow-hidden">
                <img
                  src={photo.url}
                  alt={photo.title || `Evidence ${idx + 1}`}
                  className="w-full h-full object-cover transition-transform group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-between p-2">
                  <button
                    type="button"
                    onClick={() => setSelectedImage(photo)}
                    className="p-1.5 rounded-lg bg-white/90 text-teal-950 hover:bg-white text-xs font-bold flex items-center gap-1 shadow-sm"
                  >
                    <Eye size={13} /> View
                  </button>
                  {!readOnly && (
                    <button
                      type="button"
                      onClick={() => removePhoto(photo.id)}
                      className="p-1.5 rounded-lg bg-red-600/90 text-white hover:bg-red-700 text-xs shadow-sm"
                    >
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>
              </div>

              <div className="p-2.5 flex-1 flex flex-col justify-between">
                <div className="text-xs font-bold text-teal-950 dark:text-teal-50 line-clamp-1 mb-1">
                  {photo.title || `Photo #${idx + 1}`}
                </div>
                {!readOnly ? (
                  <input
                    type="text"
                    placeholder="Add caption (e.g. cracked rotor)..."
                    value={photo.caption || ''}
                    onChange={(e) => updateCaption(photo.id, e.target.value)}
                    className="w-full text-[11px] p-1.5 rounded-md border border-outline-variant/40 bg-white dark:bg-teal-900/50 text-teal-900 dark:text-teal-100 focus:outline-none focus:border-lime-500"
                  />
                ) : (
                  <p className="text-[11px] text-on-surface-variant italic">{photo.caption || 'No caption provided'}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="p-6 rounded-xl border border-dashed border-outline-variant/60 text-center space-y-2 bg-slate-50/50 dark:bg-teal-950/20">
          <Camera size={28} className="mx-auto text-teal-700/40" />
          <p className="text-xs font-semibold text-teal-900 dark:text-teal-100">No evidence photographs attached yet.</p>
          <p className="text-[11px] text-on-surface-variant max-w-sm mx-auto">
            Upload clear photographs of the truck damage, dashboard warning lights, or parts requiring replacement.
          </p>
        </div>
      )}

      {/* Full-Screen Image Lightbox Modal */}
      {selectedImage && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="relative max-w-3xl w-full bg-slate-900 rounded-2xl overflow-hidden border border-white/10 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between p-4 border-b border-white/10 bg-slate-900/90">
              <div>
                <h3 className="text-sm font-bold text-white">{selectedImage.title || 'Evidence Photograph'}</h3>
                <p className="text-xs text-slate-400">{selectedImage.caption}</p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedImage(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-2 flex items-center justify-center bg-black/40">
              <img src={selectedImage.url} alt="Evidence Fullscreen" className="max-h-[70vh] w-auto object-contain rounded-lg" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
