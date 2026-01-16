import React, { useState } from 'react';
import { ChevronRight, ChevronDown, Folder, FolderOpen, FolderPlus, Edit2, Trash2, MoreVertical } from 'lucide-react';

const FolderTree = ({ folders, currentFolderId, onFolderSelect, onCreateFolder, onRenameFolder, onDeleteFolder }) => {
  const [expandedFolders, setExpandedFolders] = useState(new Set());
  const [contextMenu, setContextMenu] = useState(null);
  const [renamingFolder, setRenamingFolder] = useState(null);
  const [newFolderName, setNewFolderName] = useState('');

  // Build tree structure from flat list
  const buildTree = (folders) => {
    const folderMap = {};
    const tree = [];

    folders.forEach(folder => {
      folderMap[folder.id] = { ...folder, children: [] };
    });

    folders.forEach(folder => {
      if (folder.parent_folder_id && folderMap[folder.parent_folder_id]) {
        folderMap[folder.parent_folder_id].children.push(folderMap[folder.id]);
      } else if (!folder.parent_folder_id) {
        tree.push(folderMap[folder.id]);
      }
    });

    return tree;
  };

  const toggleExpand = (folderId) => {
    const newExpanded = new Set(expandedFolders);
    if (newExpanded.has(folderId)) {
      newExpanded.delete(folderId);
    } else {
      newExpanded.add(folderId);
    }
    setExpandedFolders(newExpanded);
  };

  const handleContextMenu = (e, folder) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({ folder, x: e.clientX, y: e.clientY });
  };

  const handleRename = (folder) => {
    setRenamingFolder(folder.id);
    setNewFolderName(folder.name);
    setContextMenu(null);
  };

  const submitRename = () => {
    if (newFolderName.trim() && renamingFolder) {
      onRenameFolder(renamingFolder, newFolderName.trim());
      setRenamingFolder(null);
      setNewFolderName('');
    }
  };

  const handleNewSubfolder = (parentFolder) => {
    const name = prompt('Enter folder name:');
    if (name && name.trim()) {
      onCreateFolder(name.trim(), parentFolder.id);
    }
    setContextMenu(null);
  };

  const handleDelete = (folder) => {
    if (window.confirm(`Delete folder "${folder.name}"? Contents will be moved to parent folder.`)) {
      onDeleteFolder(folder.id);
    }
    setContextMenu(null);
  };

  const renderFolder = (folder, level = 0) => {
    const isExpanded = expandedFolders.has(folder.id);
    const isSelected = currentFolderId === folder.id;
    const hasChildren = folder.children && folder.children.length > 0;

    return (
      <div key={folder.id}>
        <div
          className={`flex items-center gap-2 py-2 px-3 cursor-pointer rounded transition-colors ${
            isSelected ? 'bg-blue-50 text-blue-700' : 'hover:bg-gray-50'
          }`}
          style={{ paddingLeft: `${level * 20 + 12}px` }}
          onClick={() => onFolderSelect(folder.id)}
          onContextMenu={(e) => handleContextMenu(e, folder)}
        >
          {hasChildren ? (
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleExpand(folder.id);
              }}
              className="p-0.5 hover:bg-gray-200 rounded"
            >
              {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </button>
          ) : (
            <div className="w-5" />
          )}

          {isExpanded ? <FolderOpen className="w-5 h-5 text-blue-500" /> : <Folder className="w-5 h-5 text-blue-500" />}

          {renamingFolder === folder.id ? (
            <input
              type="text"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              onBlur={submitRename}
              onKeyDown={(e) => {
                if (e.key === 'Enter') submitRename();
                if (e.key === 'Escape') setRenamingFolder(null);
              }}
              onClick={(e) => e.stopPropagation()}
              className="flex-1 px-2 py-0.5 border border-blue-500 rounded text-sm"
              autoFocus
            />
          ) : (
            <>
              <span className="flex-1 text-sm font-medium">{folder.name}</span>
              {folder.document_count > 0 && (
                <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                  {folder.document_count}
                </span>
              )}
            </>
          )}

          <button
            onClick={(e) => handleContextMenu(e, folder)}
            className="p-1 hover:bg-gray-200 rounded opacity-0 group-hover:opacity-100"
          >
            <MoreVertical className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        {isExpanded && hasChildren && (
          <div>
            {folder.children.map(child => renderFolder(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  const tree = buildTree(folders);

  return (
    <div className="border-r border-gray-200 bg-white h-full overflow-y-auto">
      <div className="p-4 border-b border-gray-200">
        <button
          onClick={() => onCreateFolder('New Folder', null)}
          className="flex items-center gap-2 w-full px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <FolderPlus className="w-4 h-4" />
          New Folder
        </button>
      </div>

      <div className="p-2">
        <div
          className={`flex items-center gap-2 py-2 px-3 cursor-pointer rounded transition-colors ${
            currentFolderId === null ? 'bg-blue-50 text-blue-700' : 'hover:bg-gray-50'
          }`}
          onClick={() => onFolderSelect(null)}
        >
          <Folder className="w-5 h-5 text-gray-500" />
          <span className="flex-1 text-sm font-medium">All Documents</span>
        </div>

        {tree.map(folder => renderFolder(folder, 0))}
      </div>

      {/* Context Menu */}
      {contextMenu && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setContextMenu(null)}
          />
          <div
            className="fixed z-50 bg-white rounded-lg shadow-lg border border-gray-200 py-1 w-48"
            style={{ left: contextMenu.x, top: contextMenu.y }}
          >
            <button
              onClick={() => handleNewSubfolder(contextMenu.folder)}
              className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
            >
              <FolderPlus className="w-4 h-4" />
              New Subfolder
            </button>
            <button
              onClick={() => handleRename(contextMenu.folder)}
              className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
            >
              <Edit2 className="w-4 h-4" />
              Rename
            </button>
            <button
              onClick={() => handleDelete(contextMenu.folder)}
              className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2 text-red-600"
            >
              <Trash2 className="w-4 h-4" />
              Delete
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default FolderTree;
