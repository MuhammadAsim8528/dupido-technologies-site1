import { useState, useRef } from 'react';
import { Upload, FileUp, X, CheckCircle2, AlertCircle, Loader2, Package } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../components/Toast';
import { supabase } from '../../lib/supabase';
import { CATEGORY_LABELS, type ProjectCategory } from '../../lib/types';

export default function UploadProject() {
  const { user } = useAuth();
  const { addToast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const imageRef = useRef<HTMLInputElement>(null);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [version, setVersion] = useState('1.0.0');
  const [category, setCategory] = useState<ProjectCategory>('ai_tools');
  const [changelog, setChangelog] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [previewImage, setPreviewImage] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const allowed = ['.exe', '.zip', '.apk', '.tar.gz', '.dmg', '.deb'];
    const ext = f.name.substring(f.name.lastIndexOf('.')).toLowerCase();
    if (!allowed.some(a => f.name.toLowerCase().endsWith(a))) {
      addToast('error', 'Only .exe, .zip, .apk, .tar.gz, .dmg, .deb files allowed');
      return;
    }
    setFile(f);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !title.trim() || !description.trim() || !file) {
      setError('Title, description, and file are required');
      return;
    }
    setError('');
    setUploading(true);

    try {
      // Upload file to Supabase Storage
      const fileExt = file.name.split('.').pop();
      const filePath = `projects/${user.id}/${Date.now()}-${title.replace(/\s+/g, '-')}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('project-files')
        .upload(filePath, file);

      if (uploadError) throw new Error('File upload failed: ' + uploadError.message);

      const { data: urlData } = supabase.storage.from('project-files').getPublicUrl(filePath);
      const fileUrl = urlData.publicUrl;

      // Upload preview image if provided
      let previewUrl = null;
      if (previewImage) {
        const imgPath = `projects/${user.id}/${Date.now()}-preview.${previewImage.name.split('.').pop()}`;
        await supabase.storage.from('project-files').upload(imgPath, previewImage);
        const { data: imgUrlData } = supabase.storage.from('project-files').getPublicUrl(imgPath);
        previewUrl = imgUrlData.publicUrl;
      }

      // Create project record
      const { error: insertError } = await supabase.from('projects').insert({
        user_id: user.id,
        title: title.trim(),
        description: description.trim(),
        version,
        category,
        file_url: fileUrl,
        file_name: file.name,
        file_size: file.size,
        preview_image_url: previewUrl,
        changelog: changelog.trim() || null,
        status: 'published',
      });

      if (insertError) throw new Error('Failed to create project: ' + insertError.message);

      setSuccess(true);
      addToast('success', 'Project published successfully!');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Upload failed');
      addToast('error', 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  if (success) {
    return (
      <div className="p-6 lg:p-8 max-w-2xl mx-auto">
        <div className="card text-center py-16">
          <div className="w-16 h-16 rounded-2xl bg-emerald-500/15 flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-8 h-8 text-emerald-400" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Project published!</h2>
          <p className="text-sm text-slate-500 mb-6">Your project is now live on the marketplace.</p>
          <button onClick={() => {
            setSuccess(false); setTitle(''); setDescription(''); setVersion('1.0.0');
            setFile(null); setPreviewImage(null); setChangelog('');
          }} className="btn-primary text-sm">
            Upload another project
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Upload className="w-6 h-6 text-emerald-400" /> Upload Project
        </h1>
        <p className="text-slate-500 mt-1 text-sm">Publish your project to the marketplace for others to download.</p>
      </div>

      <form onSubmit={handleSubmit} className="card space-y-5">
        {error && (
          <div className="px-4 py-3 bg-red-500/10 border border-red-500/20 rounded-xl text-sm text-red-400 flex items-center gap-2">
            <AlertCircle className="w-4 h-4" /> {error}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">Project title *</label>
          <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. NeuralVision SDK" className="input-field" required />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">Description *</label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Describe what your project does, key features, and use cases..." rows={4} className="input-field resize-none" required />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Version</label>
            <input type="text" value={version} onChange={(e) => setVersion(e.target.value)} placeholder="1.0.0" className="input-field" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Category</label>
            <select value={category} onChange={(e) => setCategory(e.target.value as ProjectCategory)} className="input-field">
              {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* File upload */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">Project file * (.exe, .zip, .apk, .tar.gz, .dmg, .deb)</label>
          <div
            onClick={() => fileRef.current?.click()}
            className="border-2 border-dashed border-slate-800/80 rounded-xl p-8 text-center cursor-pointer hover:border-emerald-500/30 transition-colors"
          >
            {file ? (
              <div className="flex items-center justify-center gap-3">
                <Package className="w-8 h-8 text-emerald-400" />
                <div className="text-left">
                  <div className="text-sm text-slate-300 font-medium">{file.name}</div>
                  <div className="text-xs text-slate-600">{(file.size / 1_000_000).toFixed(1)} MB</div>
                </div>
                <button type="button" onClick={(e) => { e.stopPropagation(); setFile(null); }} className="text-slate-600 hover:text-red-400">
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <>
                <FileUp className="w-8 h-8 text-slate-700 mx-auto mb-2" />
                <p className="text-sm text-slate-500">Click to select a file or drag and drop</p>
                <p className="text-xs text-slate-700 mt-1">Max 500 MB</p>
              </>
            )}
            <input ref={fileRef} type="file" className="hidden" accept=".exe,.zip,.apk,.tar.gz,.dmg,.deb" onChange={handleFileChange} />
          </div>
        </div>

        {/* Preview image */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">Preview image (optional)</label>
          <div
            onClick={() => imageRef.current?.click()}
            className="border-2 border-dashed border-slate-800/80 rounded-xl p-6 text-center cursor-pointer hover:border-emerald-500/30 transition-colors"
          >
            {previewImage ? (
              <div className="flex items-center justify-center gap-3">
                <img src={URL.createObjectURL(previewImage)} alt="Preview" className="w-16 h-16 rounded-lg object-cover" />
                <div className="text-sm text-slate-300">{previewImage.name}</div>
                <button type="button" onClick={(e) => { e.stopPropagation(); setPreviewImage(null); }} className="text-slate-600 hover:text-red-400">
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <p className="text-sm text-slate-600">Click to add a preview image</p>
            )}
            <input ref={imageRef} type="file" className="hidden" accept="image/*" onChange={(e) => { if (e.target.files?.[0]) setPreviewImage(e.target.files[0]); }} />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">Changelog (optional, Markdown supported)</label>
          <textarea value={changelog} onChange={(e) => setChangelog(e.target.value)} placeholder={`## v${version}\n- Added new feature\n- Fixed bug`} rows={4} className="input-field resize-none font-mono text-xs" />
        </div>

        <button type="submit" disabled={uploading || !file} className="btn-primary w-full flex items-center justify-center gap-2">
          {uploading ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> Uploading...</>
          ) : (
            <><Upload className="w-4 h-4" /> Publish project</>
          )}
        </button>
      </form>
    </div>
  );
}
