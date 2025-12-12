# Custom Metrics Design

## Philosophy: Data-Oriented without Over-Gamification

The custom metrics feature is designed for data-oriented users who want to track their productivity in personalized ways, while maintaining safeguards against over-gamification and distraction.

## Design Principles

1. **Simplicity First**: Keep metrics simple and actionable
2. **Anti-Gaming**: Prevent users from creating overly complex metric systems
3. **Focus on Process**: Metrics should track process, not just outcomes
4. **Minimal Distraction**: Metrics should inform, not become the focus

## Proposed Custom Metrics

### 1. Focus Quality Score (Simple Average)
**Formula**: Average session completion percentage
**Purpose**: Measure commitment adherence
**Display**: Single number (0-100%)
**Anti-gaming**: Based on commitment, not absolute time

### 2. Consistency Index
**Formula**: Percentage of active days with at least one session
**Purpose**: Track habit consistency
**Display**: Percentage over last 7/30 days
**Anti-gaming**: Binary (session or no session), not influenced by volume

### 3. Deep Work Ratio
**Formula**: (Sessions >= 60min) / (Total sessions)
**Purpose**: Encourage longer, deeper focus periods
**Display**: Percentage
**Anti-gaming**: Encourages quality over quantity

### 4. Recovery Cadence
**Formula**: Average time between sessions
**Purpose**: Track sustainable pacing
**Display**: Hours between sessions
**Anti-gaming**: Discourages cramming

## Implementation Strategy

### Phase 1 (Current PR) - Foundation
- Add `customMetrics` field to UserSettings
- Create basic metric calculation functions
- Display 2-3 default metrics in dashboard

### Phase 2 (Future) - Customization
- Allow users to toggle metrics on/off
- Add metric descriptions/tooltips
- Export metrics in CSV

### Phase 3 (Future) - Advanced
- Custom metric formulas (with safety limits)
- Weekly/monthly metric trends
- Metric comparison views

## Data Structure

```typescript
interface CustomMetric {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  value?: number;
  unit?: string;
  trend?: 'up' | 'down' | 'neutral';
}

interface UserSettings {
  // ... existing fields
  enabledMetrics?: string[]; // IDs of enabled metrics
}
```

## Anti-Gamification Safeguards

1. **Maximum 5 Metrics**: Prevent information overload
2. **Fixed Formulas**: No custom formulas in v1 to prevent gaming
3. **Process-Focused**: Metrics measure behavior, not outcomes
4. **No Comparisons**: No leaderboards or social features
5. **Contextual Display**: Metrics shown in analytics, not during sessions

## Metrics to Avoid

- Streak counting (creates pressure, contradicts rest days)
- Point systems (pure gamification)
- Achievements/badges (distracting)
- Social comparison (toxic)
- Monetary equivalents (misaligned incentives)
