# Workflow Engine Frontend Components

This directory contains all frontend components for the BuildPro workflow engine, providing a complete UI-driven approval workflow system.

## 📁 Component Structure

```
workflows/
├── WorkflowTasks.jsx              # Main task list page
├── WorkflowStatusWidget.jsx       # Reusable status display widget
├── WorkflowActionModal.jsx        # Approval/rejection modal
├── WorkflowHistoryModal.jsx       # Audit trail viewer
├── WorkflowBuilder.jsx            # Visual workflow template builder
├── WorkflowTemplates.jsx          # Template management page
├── WorkflowAnalytics.jsx          # Analytics dashboard
├── components/                    # Builder sub-components
│   ├── StageNode.jsx             # Individual workflow stage
│   ├── StageToolbox.jsx          # Stage type selection
│   └── StageProperties.jsx       # Stage configuration panel
├── index.js                       # Component exports
└── README.md                      # This file
```

## 🎯 Core Components

### WorkflowTasks
**Purpose:** Main workflow task list showing all items awaiting user's approval

**Features:**
- Grouped by urgency (overdue, due soon, on track)
- Filterable by entity type and project
- Sortable by due date, priority, stage
- Quick approve/reject actions
- Real-time statistics

**Usage:**
```jsx
import WorkflowTasks from './components/workflows/WorkflowTasks';

<WorkflowTasks projectId={projectId} token={token} />
```

---

### WorkflowStatusWidget
**Purpose:** Reusable component to display workflow status on entity pages

**Props:**
- `entityType`: Type of entity (submittal, rfi, change_order)
- `entityId`: UUID of the entity
- `projectId`: Current project ID
- `token`: Authentication token
- `onTransition`: Callback when workflow action is taken

**Usage:**
```jsx
import WorkflowStatusWidget from './components/workflows/WorkflowStatusWidget';

<WorkflowStatusWidget
  entityType="submittal"
  entityId={submittalId}
  projectId={projectId}
  token={token}
  onTransition={(workflowId, transition) => {
    // Handle transition, refresh data
  }}
/>
```

---

### WorkflowActionModal
**Purpose:** Modal for taking workflow actions (approve, reject, request changes)

**Props:**
- `workflowId`: UUID of the workflow
- `availableTransitions`: Array of possible transitions
- `entityName`: Display name of the entity
- `token`: Authentication token
- `onSubmit`: Callback when action is submitted
- `onClose`: Callback to close modal

**Usage:**
```jsx
import WorkflowActionModal from './components/workflows/WorkflowActionModal';

<WorkflowActionModal
  workflowId={workflowId}
  availableTransitions={transitions}
  entityName="Submittal: S-045"
  token={token}
  onSubmit={(result) => {
    // Refresh data
  }}
  onClose={() => setShowModal(false)}
/>
```

---

### WorkflowHistoryModal
**Purpose:** Display complete audit trail of workflow actions

**Props:**
- `workflowId`: UUID of the workflow
- `entityName`: Display name of the entity
- `token`: Authentication token
- `onClose`: Callback to close modal

**Usage:**
```jsx
import WorkflowHistoryModal from './components/workflows/WorkflowHistoryModal';

<WorkflowHistoryModal
  workflowId={workflowId}
  entityName="Submittal: S-045"
  token={token}
  onClose={() => setShowHistory(false)}
/>
```

---

### WorkflowBuilder
**Purpose:** Visual drag-and-drop workflow template creator

**Props:**
- `templateId`: Optional UUID for editing existing template
- `projectId`: Current project ID
- `token`: Authentication token
- `onSave`: Callback when template is saved
- `onClose`: Callback to close builder

**Features:**
- Drag-and-drop stage creation
- Connect stages with transition arrows
- Configure stage properties (SLA, assignment rules)
- Save as template

**Usage:**
```jsx
import WorkflowBuilder from './components/workflows/WorkflowBuilder';

<WorkflowBuilder
  templateId={editingTemplate?.id}
  projectId={projectId}
  token={token}
  onSave={(template) => {
    // Handle saved template
  }}
  onClose={() => setShowBuilder(false)}
/>
```

---

### WorkflowTemplates
**Purpose:** Manage workflow templates

**Props:**
- `projectId`: Current project ID
- `token`: Authentication token

**Features:**
- List all templates by entity type
- Create new template
- Edit existing template
- Set default template
- Duplicate template
- Delete template
- Preview template flow

**Usage:**
```jsx
import WorkflowTemplates from './components/workflows/WorkflowTemplates';

<WorkflowTemplates projectId={projectId} token={token} />
```

---

### WorkflowAnalytics
**Purpose:** Analytics dashboard for workflow performance

**Props:**
- `projectId`: Current project ID
- `token`: Authentication token

**Features:**
- Average completion time by entity type
- SLA compliance rate
- Bottleneck analysis
- Charts and graphs

**Usage:**
```jsx
import WorkflowAnalytics from './components/workflows/WorkflowAnalytics';

<WorkflowAnalytics projectId={projectId} token={token} />
```

## 🔌 Integration Examples

### Integrating with Entity Pages

#### Submittals Integration
```jsx
import WorkflowStatusWidget from './components/workflows/WorkflowStatusWidget';

// In submittal detail modal
<div className="border-t border-b border-gray-200 py-4">
  <WorkflowStatusWidget
    entityType="submittal"
    entityId={selectedSubmittal.id}
    projectId={projectId}
    token={token}
    onTransition={() => loadSubmittals()}
  />
</div>

// Start workflow button
{submittal.status === 'submitted' && !submittal.workflow_id && (
  <button onClick={handleStartWorkflow}>
    Start Approval Workflow
  </button>
)}
```

#### RFI Integration
```jsx
// Similar to submittals
<WorkflowStatusWidget
  entityType="rfi"
  entityId={rfiId}
  projectId={projectId}
  token={token}
  onTransition={() => loadRFIs()}
/>
```

#### Change Order Integration
```jsx
// In financials page
<WorkflowStatusWidget
  entityType="change_order"
  entityId={changeOrderId}
  projectId={projectId}
  token={token}
  onTransition={() => loadChangeOrders()}
/>
```

### Dashboard Integration
```jsx
// Add workflow statistics widget
{workflowStats && (
  <div className="bg-white rounded-lg border border-gray-200 p-6">
    <h3>My Pending Approvals</h3>
    <div>Overdue: {workflowStats.overdue}</div>
    <div>Due Soon: {workflowStats.due_soon}</div>
    <div>On Track: {workflowStats.on_track}</div>
    <button onClick={() => navigate('workflows')}>
      View All Tasks
    </button>
  </div>
)}
```

## 🔐 Permissions

The workflow system uses the following permissions (defined in `PermissionContext.js`):

- `view_workflows` - Viewer level (can see workflows)
- `start_workflow` - Subcontractor level (can start workflows)
- `approve_workflow` - Engineer level (can approve/reject)
- `reject_workflow` - Engineer level (can reject)
- `cancel_workflow` - Superintendent level (can cancel workflows)
- `create_workflow_template` - Project Manager level (can create templates)
- `edit_workflow_template` - Project Manager level (can edit templates)
- `delete_workflow_template` - Admin level (can delete templates)
- `view_workflow_analytics` - Superintendent level (can view analytics)

**Usage:**
```jsx
import { usePermissions } from '../contexts/PermissionContext';

const { can } = usePermissions();

{can('start_workflow') && (
  <button>Start Workflow</button>
)}
```

## 📡 API Integration

All components use the following base API URL:
```javascript
const API_URL = 'https://buildpro-api.onrender.com/api/v1';
```

### Key Endpoints

#### Tasks
- `GET /workflows/tasks/my-tasks?project_id={id}` - Get user's pending tasks
- `POST /workflows/{id}/transition` - Execute workflow transition

#### Workflow Status
- `GET /workflows/entity/{type}/{id}` - Get workflow for entity
- `GET /workflows/{id}` - Get workflow details
- `GET /workflows/{id}/history` - Get workflow history
- `GET /workflows/{id}/transitions` - Get available transitions

#### Templates
- `GET /workflows/templates?entity_type={type}` - List templates
- `GET /workflows/templates/{id}` - Get template details
- `POST /workflows/templates` - Create template
- `PUT /workflows/templates/{id}` - Update template
- `DELETE /workflows/templates/{id}` - Delete template

#### Analytics
- `GET /workflows/stats/project/{id}` - Get project workflow statistics
- `GET /workflows/project/{id}?status=completed` - Get completed workflows

#### Workflow Management
- `POST /workflows/start` - Start a new workflow
- `POST /workflows/{id}/cancel` - Cancel a workflow

## 🎨 Design Patterns

### API Call Pattern
```javascript
const apiCall = async (endpoint, options = {}) => {
  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...options.headers
    }
  });
  if (!response.ok) throw new Error('Request failed');
  return response.json();
};
```

### Status Color Pattern
```javascript
const getStatusColor = (status) => {
  const colors = {
    'active': 'bg-blue-100 text-blue-700',
    'completed': 'bg-green-100 text-green-700',
    'rejected': 'bg-red-100 text-red-700',
    'overdue': 'bg-red-100 text-red-700'
  };
  return colors[status] || 'bg-gray-100 text-gray-700';
};
```

### Modal Pattern
```javascript
{showModal && (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
    <div className="bg-white rounded-lg max-w-2xl w-full p-6">
      {/* Modal content */}
    </div>
  </div>
)}
```

## 🚀 Getting Started

1. **Add navigation to App.js**
```jsx
import WorkflowTasks from './components/workflows/WorkflowTasks';

// Add to navigation
{ id: 'workflows', icon: Activity, label: 'Workflows' }

// Add routing
{currentView === 'workflows' && (
  <WorkflowTasks projectId={selectedProject.id} token={token} />
)}
```

2. **Update PermissionContext.js**
```jsx
// Add workflow permissions (already done)
'view_workflows': hasPermission('viewer'),
'start_workflow': hasPermission('subcontractor'),
// etc...
```

3. **Integrate into entity pages**
```jsx
// Import widget
import WorkflowStatusWidget from './components/workflows/WorkflowStatusWidget';

// Add to detail modal
<WorkflowStatusWidget
  entityType="submittal"
  entityId={entityId}
  projectId={projectId}
  token={token}
  onTransition={handleRefresh}
/>
```

## 📊 Workflow States

### Workflow Status
- `active` - Currently in progress
- `completed` - Successfully completed
- `rejected` - Rejected during review
- `cancelled` - Manually cancelled

### Urgency Levels
- `overdue` - Past due date (red)
- `due_soon` - Due within 24 hours (yellow)
- `on_track` - More than 24 hours remaining (green)

### Stage Types
- `approval` - Requires approval
- `review` - Review and feedback
- `notify` - Notification only
- `decision` - Conditional branching

### Transition Actions
- `approve` - Move to next stage
- `reject` - Reject and end workflow
- `revise` - Request changes, return to previous stage
- `request_changes` - Request modifications

## 🐛 Troubleshooting

### Workflow not showing on entity
- Check if workflow has been started for the entity
- Verify entity has correct status for workflow initiation
- Check permissions with `can('view_workflows')`

### Cannot take actions
- Verify user has `approve_workflow` permission
- Check if user is assigned to current stage
- Verify workflow status is `active`

### Builder not saving
- Ensure all stages have names
- Check that transitions are properly defined
- Verify user has `create_workflow_template` permission

## 📝 Future Enhancements

- Email notifications for pending approvals
- Mobile-responsive workflow builder
- Workflow templates marketplace
- Advanced analytics (predictive completion times)
- Bulk actions (approve multiple items)
- Custom action types (webhooks, API calls)
- Conditional branching (if amount > $50k, route to owner)
- Parallel approvals (multiple reviewers simultaneously)
- Delegation support (reassign to another user)

## 📚 Related Documentation

- Backend API: `/backend/docs/WORKFLOWS.md`
- Database Schema: `/backend/docs/DATABASE.md`
- Permission System: `/frontend/src/contexts/PermissionContext.js`

## 🤝 Contributing

When adding new workflow features:

1. Follow existing component patterns
2. Add proper TypeScript/PropTypes if using
3. Update this README
4. Add tests for new components
5. Ensure mobile responsiveness
6. Follow accessibility guidelines (ARIA labels, keyboard navigation)

## 📄 License

Part of BuildPro Construction Management System
