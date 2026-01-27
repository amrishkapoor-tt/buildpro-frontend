import React, { useState } from 'react';
import { List, Settings, BarChart3 } from 'lucide-react';
import WorkflowTasks from './WorkflowTasks';
import WorkflowTemplates from './WorkflowTemplates';
import WorkflowAnalytics from './WorkflowAnalytics';

const WorkflowsPage = ({ projectId, token }) => {
  const [activeTab, setActiveTab] = useState('tasks');

  const tabs = [
    { id: 'tasks', label: 'My Tasks', icon: List },
    { id: 'templates', label: 'Templates', icon: Settings },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 }
  ];

  return (
    <div className="h-full flex flex-col">
      {/* Tab Navigation */}
      <div className="bg-white border-b border-gray-200 px-6">
        <div className="flex gap-1">
          {tabs.map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 font-medium transition-colors relative ${
                  activeTab === tab.id
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Icon className="w-5 h-5" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-auto bg-gray-50 p-6">
        {activeTab === 'tasks' && (
          <WorkflowTasks projectId={projectId} token={token} />
        )}
        {activeTab === 'templates' && (
          <WorkflowTemplates projectId={projectId} token={token} />
        )}
        {activeTab === 'analytics' && (
          <WorkflowAnalytics projectId={projectId} token={token} />
        )}
      </div>
    </div>
  );
};

export default WorkflowsPage;
