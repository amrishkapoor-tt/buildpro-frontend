import React, { useState, useEffect } from 'react';
import { Camera, Image, Plus, X, Tag, MapPin, Calendar, Search, Link2, Trash2, Download } from 'lucide-react';

const API_URL = 'https://buildpro-api.onrender.com/api/v1';

const Photos = ({ projectId, token }) => {
  const [albums, setAlbums] = useState([]);
  const [photos, setPhotos] = useState([]);
  const [selectedAlbum, setSelectedAlbum] = useState(null);
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [allTags, setAllTags] = useState([]);
  const [filterTag, setFilterTag] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  
  const [showNewAlbum, setShowNewAlbum] = useState(false);
  const [showUploadPhoto, setShowUploadPhoto] = useState(false);
  const [showPhotoDetail, setShowPhotoDetail] = useState(false);
  const [showLinkModal, setShowLinkModal] = useState(false);
  
  const [albumForm, setAlbumForm] = useState({ name: '', description: '' });
  const [photoForm, setPhotoForm] = useState({
    title: '',
    description: '',
    tags: '',
    location: '',
    taken_at: new Date().toISOString().split('T')[0]
  });
  const [uploadFile, setUploadFile] = useState(null);
  const [linkForm, setLinkForm] = useState({ target_type: 'rfi', target_id: '', coordinates: { x: '', y: '' } });

  useEffect(() => {
    if (projectId) {
      loadAlbums();
      loadPhotos();
      loadTags();
    }
  }, [projectId]);

  useEffect(() => {
    // Auto-select first album when upload modal opens and no album is selected
    if (showUploadPhoto && !selectedAlbum && albums.length > 0) {
      setSelectedAlbum(albums[0]);
    }
  }, [showUploadPhoto, selectedAlbum, albums]);

  const apiCall = async (endpoint, options = {}) => {
    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers: {
        'Authorization': `Bearer ${token}`,
        ...(!(options.body instanceof FormData) && { 'Content-Type': 'application/json' }),
        ...options.headers
      }
    });
    if (!response.ok) throw new Error('Request failed');
    return response.json();
  };

  const loadAlbums = async () => {
    try {
      const data = await apiCall(`/projects/${projectId}/photo-albums`);
      setAlbums(data.albums || []);
    } catch (error) {
      console.error('Failed to load albums:', error);
    }
  };

  const loadPhotos = async () => {
    setLoading(true);
    try {
      const data = await apiCall(`/projects/${projectId}/photos`);
      setPhotos(data.photos || []);
    } catch (error) {
      console.error('Failed to load photos:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadTags = async () => {
    try {
      const data = await apiCall(`/projects/${projectId}/tags`);
      setAllTags(data.tags || []);
    } catch (error) {
      console.error('Failed to load tags:', error);
    }
  };

  const handleCreateAlbum = async (e) => {
    e.preventDefault();
    try {
      const data = await apiCall(`/projects/${projectId}/photo-albums`, {
        method: 'POST',
        body: JSON.stringify(albumForm)
      });
      setAlbums([data.album, ...albums]);
      setSelectedAlbum(data.album);
      setShowNewAlbum(false);
      setAlbumForm({ name: '', description: '' });
    } catch (error) {
      alert('Failed to create album: ' + error.message);
    }
  };

  const handleUploadPhoto = async (e) => {
    e.preventDefault();
    if (!uploadFile || !selectedAlbum) return;

    try {
      const formData = new FormData();
      formData.append('photo', uploadFile);
      formData.append('title', photoForm.title);
      formData.append('description', photoForm.description);
      formData.append('taken_at', photoForm.taken_at);
      if (photoForm.location) {
        formData.append('location', JSON.stringify({ address: photoForm.location }));
      }

      const data = await apiCall(`/photo-albums/${selectedAlbum.id}/photos`, {
        method: 'POST',
        body: formData
      });

      // Add tags if provided
      if (photoForm.tags) {
        const tags = photoForm.tags.split(',').map(t => t.trim()).filter(t => t);
        await apiCall(`/photos/${data.photo.id}/tags`, {
          method: 'POST',
          body: JSON.stringify({ tags })
        });
      }

      setShowUploadPhoto(false);
      setPhotoForm({ title: '', description: '', tags: '', location: '', taken_at: new Date().toISOString().split('T')[0] });
      setUploadFile(null);
      loadPhotos();
    } catch (error) {
      alert('Failed to upload photo: ' + error.message);
    }
  };

  const loadPhotoDetail = async (photoId) => {
    try {
      const data = await apiCall(`/photos/${photoId}`);
      setSelectedPhoto(data.photo);
      setShowPhotoDetail(true);
    } catch (error) {
      console.error('Failed to load photo:', error);
    }
  };

  const handleLinkPhoto = async () => {
    if (!selectedPhoto || !linkForm.target_id) return;

    try {
      const metadata = linkForm.target_type === 'drawing_sheet'
        ? { x: parseInt(linkForm.coordinates.x, 10) || 0, y: parseInt(linkForm.coordinates.y, 10) || 0 }
        : {};

      await apiCall(`/photos/${selectedPhoto.id}/link`, {
        method: 'POST',
        body: JSON.stringify({
          target_type: linkForm.target_type,
          target_id: linkForm.target_id,
          metadata
        })
      });

      setShowLinkModal(false);
      setLinkForm({ target_type: 'rfi', target_id: '', coordinates: { x: '', y: '' } });
      loadPhotoDetail(selectedPhoto.id);
    } catch (error) {
      alert('Failed to link photo: ' + error.message);
    }
  };

  const handleDeletePhoto = async (photoId, photoTitle) => {
    if (!window.confirm(`Delete photo "${photoTitle}"?`)) return;

    try {
      await apiCall(`/photos/${photoId}`, {
        method: 'DELETE'
      });
      setShowPhotoDetail(false);
      setSelectedPhoto(null);
      loadPhotos();
    } catch (error) {
      alert('Failed to delete photo: ' + error.message);
    }
  };

  const filteredPhotos = photos.filter(photo => {
    const matchesAlbum = !selectedAlbum || photo.album_id === selectedAlbum.id;
    const matchesTag = !filterTag || (photo.tags && photo.tags.includes(filterTag));
    const matchesSearch = !searchTerm || 
      (photo.title && photo.title.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (photo.description && photo.description.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesAlbum && matchesTag && matchesSearch;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h2 className="text-2xl font-semibold text-gray-900">Photos</h2>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search photos..."
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowNewAlbum(true)}
            className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
          >
            <Plus className="w-5 h-5" />
            New Album
          </button>
          <button
            onClick={() => setShowUploadPhoto(true)}
            disabled={albums.length === 0}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300"
          >
            <Camera className="w-5 h-5" />
            Upload Photo
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar */}
        <div className="space-y-6">
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <h3 className="font-semibold text-gray-900 mb-3">Albums</h3>
            <div className="space-y-2">
              <button
                onClick={() => setSelectedAlbum(null)}
                className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                  !selectedAlbum ? 'bg-blue-50 text-blue-700' : 'hover:bg-gray-50 text-gray-700'
                }`}
              >
                All Photos ({photos.length})
              </button>
              {albums.map(album => (
                <button
                  key={album.id}
                  onClick={() => setSelectedAlbum(album)}
                  className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                    selectedAlbum?.id === album.id ? 'bg-blue-50 text-blue-700' : 'hover:bg-gray-50 text-gray-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-sm truncate">{album.name}</span>
                    <span className="text-sm text-gray-500">{album.photo_count || 0}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {allTags.length > 0 && (
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <h3 className="font-semibold text-gray-900 mb-3">Tags</h3>
              <div className="space-y-2">
                <button
                  onClick={() => setFilterTag(null)}
                  className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                    !filterTag ? 'bg-blue-50 text-blue-700' : 'hover:bg-gray-50 text-gray-700'
                  }`}
                >
                  All Tags
                </button>
                {allTags.map(({ tag, count }) => (
                  <button
                    key={tag}
                    onClick={() => setFilterTag(tag)}
                    className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                      filterTag === tag ? 'bg-blue-50 text-blue-700' : 'hover:bg-gray-50 text-gray-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Tag className="w-4 h-4" />
                        <span className="text-sm">{tag}</span>
                      </div>
                      <span className="text-sm text-gray-500">{count}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Photos Grid */}
        <div className="lg:col-span-3">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            {loading ? (
              <div className="text-center py-12">Loading...</div>
            ) : filteredPhotos.length === 0 ? (
              <div className="text-center py-12">
                <Camera className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No photos found</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {filteredPhotos.map(photo => {
                  const photoUrl = photo.file_url || `${API_URL.replace('/api/v1', '')}/${photo.file_path}`;
                  return (
                    <div
                      key={photo.id}
                      onClick={() => loadPhotoDetail(photo.id)}
                      className="group relative aspect-square bg-gray-100 rounded-lg overflow-hidden cursor-pointer hover:ring-2 hover:ring-blue-500 transition-all"
                    >
                      {photoUrl ? (
                        <img
                          src={photoUrl}
                          alt={photo.title}
                          className="absolute inset-0 w-full h-full object-cover"
                          onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.nextSibling.style.display = 'flex';
                          }}
                        />
                      ) : null}
                      <div className="absolute inset-0 hidden items-center justify-center bg-gradient-to-br from-blue-400 to-purple-500">
                        <Image className="w-12 h-12 text-white opacity-50" />
                      </div>
                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-60 transition-all flex flex-col justify-end p-3">
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                          <p className="text-white font-medium text-sm truncate">{photo.title}</p>
                          <div className="flex items-center gap-2 mt-1">
                            {photo.location && (
                              <span className="flex items-center gap-1 text-xs text-white">
                                <MapPin className="w-3 h-3" />
                              </span>
                            )}
                            {photo.tags && photo.tags.length > 0 && (
                              <span className="flex items-center gap-1 text-xs text-white">
                                <Tag className="w-3 h-3" />
                                {photo.tags.length}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* New Album Modal */}
      {showNewAlbum && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-gray-900">Create Album</h3>
              <button onClick={() => setShowNewAlbum(false)}>
                <X className="w-6 h-6 text-gray-400" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Album Name</label>
                <input
                  value={albumForm.name}
                  onChange={(e) => setAlbumForm({ ...albumForm, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Site Progress - January 2024"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={albumForm.description}
                  onChange={(e) => setAlbumForm({ ...albumForm, description: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  onClick={handleCreateAlbum}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Create Album
                </button>
                <button
                  onClick={() => setShowNewAlbum(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Upload Photo Modal */}
      {showUploadPhoto && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-lg max-w-2xl w-full p-6 my-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-gray-900">Upload Photo</h3>
              <button onClick={() => setShowUploadPhoto(false)}>
                <X className="w-6 h-6 text-gray-400" />
              </button>
            </div>
            <div className="space-y-4">
              {albums.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Select Album</label>
                  <select
                    value={selectedAlbum?.id || ''}
                    onChange={(e) => setSelectedAlbum(albums.find(a => a.id === e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {albums.map(album => (
                      <option key={album.id} value={album.id}>{album.name}</option>
                    ))}
                  </select>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Photo File</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setUploadFile(e.target.files[0])}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                <input
                  value={photoForm.title}
                  onChange={(e) => setPhotoForm({ ...photoForm, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Foundation Work - East Wing"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={photoForm.description}
                  onChange={(e) => setPhotoForm({ ...photoForm, description: e.target.value })}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tags (comma separated)</label>
                <input
                  value={photoForm.tags}
                  onChange={(e) => setPhotoForm({ ...photoForm, tags: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="foundation, concrete, progress"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date Taken</label>
                  <input
                    type="date"
                    value={photoForm.taken_at}
                    onChange={(e) => setPhotoForm({ ...photoForm, taken_at: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                  <input
                    value={photoForm.location}
                    onChange={(e) => setPhotoForm({ ...photoForm, location: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="San Francisco, CA"
                  />
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  onClick={handleUploadPhoto}
                  disabled={!uploadFile}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300"
                >
                  Upload Photo
                </button>
                <button
                  onClick={() => setShowUploadPhoto(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Photo Detail Modal */}
      {showPhotoDetail && selectedPhoto && (
        <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">{selectedPhoto.title}</h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowLinkModal(true)}
                  className="p-2 text-gray-600 hover:bg-gray-100 rounded"
                  title="Link to item"
                >
                  <Link2 className="w-5 h-5" />
                </button>
                <button
                  onClick={() => handleDeletePhoto(selectedPhoto.id, selectedPhoto.title)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded"
                  title="Delete photo"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
                <button onClick={() => setShowPhotoDetail(false)}>
                  <X className="w-6 h-6 text-gray-400" />
                </button>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                  {(() => {
                    const photoUrl = selectedPhoto.file_url || `${API_URL.replace('/api/v1', '')}/${selectedPhoto.file_path}`;
                    return (
                      <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden">
                        {photoUrl ? (
                          <img
                            src={photoUrl}
                            alt={selectedPhoto.title}
                            className="w-full h-full object-contain"
                            onError={(e) => {
                              e.target.style.display = 'none';
                              e.target.nextSibling.style.display = 'flex';
                            }}
                          />
                        ) : null}
                        <div className="w-full h-full hidden items-center justify-center bg-gradient-to-br from-blue-400 to-purple-500">
                          <Image className="w-24 h-24 text-white opacity-50" />
                        </div>
                      </div>
                    );
                  })()}
                </div>
                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Description</h4>
                    <p className="text-sm text-gray-600">{selectedPhoto.description || 'No description'}</p>
                  </div>
                  {selectedPhoto.tags && selectedPhoto.tags.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Tags</h4>
                      <div className="flex flex-wrap gap-2">
                        {selectedPhoto.tags.map((tag, idx) => (
                          <span key={idx} className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Details</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2 text-gray-600">
                        <Calendar className="w-4 h-4" />
                        {new Date(selectedPhoto.taken_at).toLocaleDateString()}
                      </div>
                      {selectedPhoto.location && (
                        <div className="flex items-center gap-2 text-gray-600">
                          <MapPin className="w-4 h-4" />
                          {typeof selectedPhoto.location === 'string' ? selectedPhoto.location : selectedPhoto.location.address}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Link Photo Modal */}
      {showLinkModal && selectedPhoto && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-gray-900">Link Photo</h3>
              <button onClick={() => setShowLinkModal(false)}>
                <X className="w-6 h-6 text-gray-400" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Link Type</label>
                <select
                  value={linkForm.target_type}
                  onChange={(e) => setLinkForm({ ...linkForm, target_type: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="rfi">RFI</option>
                  <option value="drawing_sheet">Drawing Sheet</option>
                  <option value="task">Task</option>
                  <option value="punch_item">Punch Item</option>
                  <option value="daily_log">Daily Log</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ID</label>
                <input
                  value={linkForm.target_id}
                  onChange={(e) => setLinkForm({ ...linkForm, target_id: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter ID"
                />
              </div>
              {linkForm.target_type === 'drawing_sheet' && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">X</label>
                    <input
                      type="number"
                      value={linkForm.coordinates.x}
                      onChange={(e) => setLinkForm({ ...linkForm, coordinates: { ...linkForm.coordinates, x: e.target.value } })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Y</label>
                    <input
                      type="number"
                      value={linkForm.coordinates.y}
                      onChange={(e) => setLinkForm({ ...linkForm, coordinates: { ...linkForm.coordinates, y: e.target.value } })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              )}
              <div className="flex gap-3 pt-4">
                <button
                  onClick={handleLinkPhoto}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Link Photo
                </button>
                <button
                  onClick={() => setShowLinkModal(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Photos;