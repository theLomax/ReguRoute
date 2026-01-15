# ReguRoute User Workflow & Development Plan

## Current State vs Target Workflow Analysis

### **Critical Gaps Identified**
1. **Route-Equipment Disconnection**: Routes don't store which loadout was used
2. **No Avoidance Routing**: Analysis identifies violations but doesn't avoid restricted areas  
3. **Single Route Only**: No alternatives or compliance-based route scoring
4. **No Waypoint Support**: Intermediate stops not implemented
5. **Missing FOPA Analysis**: Federal interstate transport protections ignored
6. **No Pre-validation**: Origin/destination not checked before route calculation

## **Target User Workflow**

### **Phase 1: Equipment Selection** ✅ *Currently Implemented*
```
User Action: Select/create loadout with firearms, magazines, accessories
System Response: Validate equipment specifications and categorization
Current Status: COMPLETE - Rich equipment management system exists
```

### **Phase 2: Location Validation** ⚠️ *Partially Implemented*
```
User Action: Set origin and destination
System Response: 
  - Immediately validate loadout legality at both locations
  - Display compliance alerts BEFORE route calculation
  - Allow user to modify loadout or accept restrictions

Current Status: MISSING PRE-VALIDATION STEP
Implementation Needed:
  - apps/mobile/src/screens/RoutePlanning.tsx - Add validation step
  - apps/backend/src/routes/calculate.ts - Add pre-validation endpoint
```

### **Phase 3: Waypoint Management** ❌ *Not Implemented*
```
User Action: Add optional intermediate stops
System Response:
  - Validate legality at each waypoint
  - Show cumulative restriction profile
  - Conflict resolution options:
    * Modify loadout (remove restricted items)
    * Change transport method (locked case, etc.)
    * Accept restrictions with warnings

Current Status: NOT IMPLEMENTED
Implementation Needed:
  - Waypoint UI in route planning wizard
  - Per-waypoint compliance checking API
  - Overnight stop detection (24+ hours = different rules)
```

### **Phase 4: Smart Route Calculation** ⚠️ *Basic Implementation*
```
User Action: Request route calculation
System Response:
  - Generate 3-5 route alternatives
  - Score routes by: compliance + time + distance + fuel
  - Apply weights to traversed regions
  - Use existing getAvoidancePolygons() to route around restrictions
  - Present ranked options with heat maps

Current Status: SINGLE ROUTE + BASIC ANALYSIS
Implementation Needed:
  - Multi-route generation using OpenRouteService alternatives
  - Route scoring algorithm (compliance weight + travel factors)
  - Heat map visualization for compliance risk
```

### **Phase 5: Route Selection & Monitoring** ❌ *Not Implemented*
```
User Action: Review and select preferred route
System Response:
  - Show compliance trade-offs (time vs legality)
  - Display detailed regulation analysis
  - Save route with loadout association
  - Enable re-analysis if loadout changes

Current Status: NOT IMPLEMENTED
Implementation Needed:
  - Route comparison UI
  - Detailed compliance reporting
  - Route modification capabilities
```

## **Development Plan & Milestones**

### **Milestone 1: Route-Equipment Integration** (2-3 weeks)
**Priority: CRITICAL** - Foundation for all other features

#### Backend Changes
- [ ] **Database Migration**: Add `loadout_id` foreign key to routes table
  - File: `apps/backend/migrations/[timestamp]_add-loadout-to-routes.ts`
  - Add foreign key constraint to ensure data integrity

- [ ] **API Updates**: Modify route creation to store loadout association
  - File: `apps/backend/src/routes/calculate.ts:55` - Update calculateAndSaveRoute
  - Store loadout_id when saving routes
  - Add route re-analysis endpoint

- [ ] **Pre-validation Endpoint**: Check origin/destination compliance before routing
  - File: `apps/backend/src/routes/calculate.ts` - Add validateLocations endpoint
  - Use existing regulation checking logic from regulations.ts

#### Mobile Changes  
- [ ] **Equipment-Route Linking**: Associate active loadout with route creation
  - File: `apps/mobile/src/screens/RoutePlanning.tsx`
  - Pass loadout_id to route creation API

- [ ] **Pre-validation UI**: Show compliance alerts before route calculation
  - Add validation step between location selection and route calculation
  - Display warnings/errors with option to modify loadout

#### Success Criteria
- Routes store which loadout was used
- Users see compliance warnings before route calculation
- Can re-analyze existing routes with different loadouts

### **Milestone 2: Smart Avoidance Routing** (3-4 weeks)
**Priority: HIGH** - Core value proposition

#### Backend Changes
- [ ] **Multi-route Generation**: Integrate getAvoidancePolygons() with OpenRouteService
  - File: `apps/backend/src/services/regulations.ts:308` - Use existing avoidance logic
  - Modify ORS requests to avoid restricted areas
  - Generate 3-5 alternative routes (fastest, most compliant, balanced)

- [ ] **Route Scoring Algorithm**: Score routes by compliance + travel factors
  - Weight factors: legal risk (60%), time (25%), distance (15%)
  - Severity-based scoring: critical alerts = -100 points, warnings = -10
  - Normalize scores for route comparison

- [ ] **Enhanced Regulation Analysis**: Improve compliance checking
  - Add FOPA interstate transport analysis
  - Include ammunition type restrictions
  - Feature-based restriction checking (assault weapon laws)

#### Mobile Changes
- [ ] **Route Comparison UI**: Display multiple route options with scores
  - Heat map visualization showing compliance risk by segment
  - Trade-off analysis (time vs compliance)
  - Route selection with detailed breakdown

- [ ] **Advanced Preferences**: User preferences for route selection
  - Slider for compliance vs speed preference
  - Avoid specific states option
  - Transport method preferences

#### Success Criteria
- Multiple route alternatives generated
- Routes avoid restricted jurisdictions when possible
- Clear visualization of compliance trade-offs

### **Milestone 3: Waypoint Management** (2-3 weeks)
**Priority: MEDIUM** - Enhances user experience

#### Backend Changes
- [ ] **Waypoint API**: Support intermediate stops in route calculation
  - Modify route calculation to handle waypoints array
  - Per-waypoint compliance checking
  - Overnight stop detection and analysis

#### Mobile Changes
- [ ] **Waypoint UI**: Add waypoint management to route planning
  - Interactive map for adding waypoints
  - Compliance status per waypoint
  - Reorder/remove waypoints functionality

- [ ] **Conflict Resolution**: Handle waypoint compliance conflicts
  - Suggest loadout modifications
  - Transport method alternatives
  - "Skip this waypoint" option

#### Success Criteria
- Users can add multiple waypoints to routes
- Compliance checked at each stop
- Clear conflict resolution workflow

### **Milestone 4: Advanced Features** (4-5 weeks)
**Priority: LOW** - Polish and enhanced functionality

#### Features
- [ ] **FOPA Analysis**: Federal interstate transport protection coverage
- [ ] **Enhanced Regulation Database**: More jurisdictions and regulations
- [ ] **Route Modification**: Edit existing routes without recreating
- [ ] **Compliance Reporting**: Detailed legal documentation for routes
- [ ] **Regulation Updates**: Monitor for law changes affecting saved routes

## **Implementation Notes**

### **Existing Code to Leverage**
- `apps/backend/src/services/regulations.ts:308` - getAvoidancePolygons() function
- `apps/mobile/src/components/EquipmentSelector.tsx` - Rich equipment management UI
- `apps/backend/src/routes/calculate.ts` - Route calculation infrastructure
- Comprehensive regulation database schema and alert system

### **Key Architectural Decisions**
1. **Route-Loadout Association**: Foreign key relationship for data integrity
2. **Multi-route Strategy**: Generate alternatives using ORS avoid_polygons parameter
3. **Scoring Algorithm**: Weighted compliance + travel factors
4. **Incremental Enhancement**: Build on existing solid foundation

### **Risk Mitigation**
- **Database Migration**: Test migration rollback procedures
- **API Compatibility**: Maintain backward compatibility during updates
- **Performance**: Monitor route calculation time with avoidance polygons
- **Regulation Data**: Validate legal accuracy of restriction interpretations

This plan transforms ReguRoute from a basic route planner into a comprehensive compliance-aware navigation system while building on the excellent existing foundation.