# Surplus Cap Strategy - Gaming Prevention Analysis

## Problem Statement

**Observation**: The current design allows users to select the minimum commitment contract (30 minutes) and run extended sessions. This behavior can be exploited to game the system by accumulating budget surpluses.

**Proposed Initial Solution**: Cap the maximum surplus at 30 minutes.

**Key Question**: How should we "police" these behaviors to maintain the integrity of the commitment mechanism?

---

## Understanding the Problem

### Current System Behavior

1. **Commitment Contract**: User selects duration (30m, 1h, 90m, 2h, 3h, 4h)
2. **Budget Tracking**: `surplus = actual_duration - committed_duration`
3. **No Limits**: Currently, users can work far beyond their commitment
4. **Accumulation**: Surpluses accumulate over time and show as "alpha generated"

### The Gaming Scenario

**Example Attack Vector**:
```
Day 1: Commit 30m, work 3h → +2.5h surplus
Day 2: Commit 30m, work 3h → +2.5h surplus
Day 3: Commit 30m, work 30m → 0 surplus
Day 4: Skip day (use 5h of banked surplus as buffer)
Week Total: 6.5h actual work, with 4h apparent buffer
```

**Why This Matters**:
- Defeats the purpose of pre-commitment
- Allows users to "bank" time and slack off later
- Undermines the Kydland-Prescott Constraint ("Rules beat discretion")
- Reduces signal extraction quality

---

## Strategic Considerations

### Philosophical Alignment

The highBeta protocol is based on:
1. **Pre-commitment**: You commit to a duration, not a result
2. **Radical Honesty**: The scoreboard is truth
3. **Ownership Mindset**: Building assets, not logging hours
4. **No Negotiation**: Rules beat discretion

**Core Tension**: 
- We want to reward genuine overperformance (true alpha)
- We don't want to allow gaming via systematic under-commitment
- We must maintain the integrity of the commitment device

---

## Policing Strategies

### Strategy 1: Hard Cap on Session Surplus ⭐ SIMPLEST

**Implementation**: Limit surplus gain to maximum of 30 minutes per session

```typescript
// Pseudo-code
const calculateSessionSurplus = (actual: number, committed: number): number => {
  const rawSurplus = actual - committed;
  const MAX_SURPLUS_MINUTES = 30;
  
  if (rawSurplus > 0) {
    return Math.min(rawSurplus, MAX_SURPLUS_MINUTES * 60); // Cap at 30 min
  }
  return rawSurplus; // No cap on deficits
}
```

**Pros**:
- ✅ Simple to implement and understand
- ✅ Clear rule: "Surplus maxes at 30 minutes"
- ✅ Still rewards overperformance within reasonable bounds
- ✅ Prevents massive surplus banking

**Cons**:
- ❌ Arbitrary 30-minute choice (why not 20? 45?)
- ❌ Discourages genuine long sessions if commitment was conservative
- ❌ Could frustrate users who naturally work longer
- ❌ Treats all commitments equally (30m commit vs 4h commit)

**User Impact**: Low friction for honest users, high friction for gamers

---

### Strategy 2: Proportional Surplus Cap (Relative to Commitment)

**Implementation**: Cap surplus as percentage of committed time

```typescript
const calculateSessionSurplus = (actual: number, committed: number): number => {
  const rawSurplus = actual - committed;
  const MAX_SURPLUS_RATIO = 0.5; // 50% of commitment
  
  if (rawSurplus > 0) {
    const maxAllowedSurplus = committed * MAX_SURPLUS_RATIO;
    return Math.min(rawSurplus, maxAllowedSurplus);
  }
  return rawSurplus;
}

// Examples:
// 30m commit → 15m max surplus
// 2h commit → 1h max surplus
// 4h commit → 2h max surplus
```

**Pros**:
- ✅ Scales with commitment level
- ✅ Rewards higher commitments with higher surplus potential
- ✅ Creates incentive to commit realistically
- ✅ Still prevents extreme gaming

**Cons**:
- ❌ More complex to explain
- ❌ Still somewhat arbitrary (why 50%?)
- ❌ 30m sessions get very small surplus (15m)

**User Impact**: Moderate friction, rewards honest commitments

---

### Strategy 3: Diminishing Returns on Surplus

**Implementation**: Full credit up to threshold, then diminishing returns

```typescript
const calculateSessionSurplus = (actual: number, committed: number): number => {
  const rawSurplus = actual - committed;
  const FULL_CREDIT_THRESHOLD = 30 * 60; // 30 minutes full credit
  const DIMINISHING_FACTOR = 0.25; // 25% credit beyond threshold
  
  if (rawSurplus <= 0) return rawSurplus;
  
  if (rawSurplus <= FULL_CREDIT_THRESHOLD) {
    return rawSurplus; // Full credit up to 30 min
  } else {
    // First 30 min full, rest at 25%
    const beyondThreshold = rawSurplus - FULL_CREDIT_THRESHOLD;
    return FULL_CREDIT_THRESHOLD + (beyondThreshold * DIMINISHING_FACTOR);
  }
}

// Examples:
// 30m commit, 1h actual → +30m full credit
// 30m commit, 2h actual → +30m + (60m * 0.25) = +45m credited
// 30m commit, 4h actual → +30m + (180m * 0.25) = +75m credited
```

**Pros**:
- ✅ Doesn't hard-cap genuine long sessions
- ✅ Discourages gaming (low ROI on strategic under-commitment)
- ✅ Still rewards overperformance
- ✅ More nuanced and fair

**Cons**:
- ❌ Complex to understand ("Why only 25% credit?")
- ❌ Requires explanation in UI
- ❌ Could feel punishing to honest long-session workers

**User Impact**: Low friction for reasonable sessions, high friction for gamers

---

### Strategy 4: Minimum Commitment Escalation

**Implementation**: Force higher commitments as streak increases

```typescript
const getMinimumCommitment = (currentStreak: number): number => {
  const BASE_MINIMUM = 30 * 60; // 30 minutes
  
  if (currentStreak < 5) return BASE_MINIMUM;
  if (currentStreak < 10) return 60 * 60; // 1 hour after 5 days
  if (currentStreak < 20) return 90 * 60; // 90 min after 10 days
  return 120 * 60; // 2 hours after 20 days
}

// UI: "Your consistency has earned a higher minimum commitment: 1h"
```

**Pros**:
- ✅ Rewards consistency with higher standards
- ✅ Naturally prevents gaming over time
- ✅ Encourages genuine skill building
- ✅ Aligns with "capital deepening" philosophy

**Cons**:
- ❌ Could discourage new users
- ❌ Punishes legitimate short sessions on busy days
- ❌ Rigid and potentially frustrating
- ❌ Doesn't solve immediate problem (new users can still game)

**User Impact**: High friction for consistent users, creates pressure

---

### Strategy 5: Surplus Decay Over Time

**Implementation**: Surpluses depreciate if not "used"

```typescript
interface BudgetState {
  surplus: number;
  lastSessionDate: string;
}

const applySurplusDecay = (state: BudgetState, today: string): number => {
  const daysSinceSession = daysBetween(state.lastSessionDate, today);
  const DECAY_RATE = 0.1; // 10% per day
  const decayFactor = Math.pow(1 - DECAY_RATE, daysSinceSession);
  
  return state.surplus * decayFactor;
}

// Example: 2h surplus unused for 5 days → 2h * (0.9^5) ≈ 1.18h
```

**Pros**:
- ✅ Prevents long-term banking
- ✅ Encourages consistent work
- ✅ No cap on earning, just on hoarding
- ✅ Natural and intuitive ("use it or lose it")

**Cons**:
- ❌ Complex state management
- ❌ Requires date tracking
- ❌ Could punish legitimate breaks (vacations, illness)
- ❌ Doesn't prevent immediate gaming

**User Impact**: Moderate friction, encourages regularity

---

### Strategy 6: Asymmetric Penalty (Deficits Hurt More)

**Implementation**: Deficits count 1.5x, surpluses count 1.0x

```typescript
const calculateWeightedBalance = (sessions: Session[]): number => {
  return sessions.reduce((balance, session) => {
    const diff = session.actual - session.committed;
    if (diff < 0) {
      return balance + (diff * 1.5); // Deficits weighted heavier
    }
    return balance + diff; // Surpluses normal weight
  }, 0);
}
```

**Pros**:
- ✅ Maintains natural incentive structure
- ✅ Doesn't cap surpluses
- ✅ Makes deficits more costly, discouraging under-commitment
- ✅ Aligns with "debt is worse than no alpha" philosophy

**Cons**:
- ❌ Doesn't directly prevent surplus accumulation
- ❌ Could be perceived as unfair ("Why punish failure harder?")
- ❌ Complex to explain

**User Impact**: Psychological pressure to avoid deficits

---

### Strategy 7: Commitment History Tracking (Behavioral Nudge)

**Implementation**: Track and display commitment patterns

```typescript
interface CommitmentStats {
  averageCommitment: number;
  mostFrequentCommitment: number;
  commitmentVariance: number;
  suspiciousPattern: boolean;
}

const analyzeCommitmentPattern = (sessions: Session[]): CommitmentStats => {
  const commitments = sessions.map(s => s.targetDurationSeconds);
  const avg = mean(commitments);
  const mode = mostCommon(commitments);
  const variance = standardDeviation(commitments);
  
  // Flag: 80%+ of sessions are minimum commitment
  const suspiciousPattern = 
    commitments.filter(c => c === MIN_COMMITMENT).length / commitments.length > 0.8;
  
  return { averageCommitment: avg, mostFrequentCommitment: mode, commitmentVariance: variance, suspiciousPattern };
}

// UI: Show warning if pattern is suspicious
// "80% of your sessions use minimum commitment. Consider higher pre-commitment for better results."
```

**Pros**:
- ✅ Non-punitive (nudge, not rule)
- ✅ Educates user about their patterns
- ✅ Preserves user autonomy
- ✅ No complex rules or caps

**Cons**:
- ❌ Doesn't prevent gaming, just highlights it
- ❌ Sophisticated users can ignore it
- ❌ Requires analytics infrastructure

**User Impact**: Low friction, informational only

---

## Recommendation Matrix

| Strategy | Effectiveness | Complexity | User Friction | Alignment with Philosophy |
|----------|---------------|------------|---------------|---------------------------|
| **1. Hard Cap (30m)** | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐ |
| **2. Proportional Cap** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐ |
| **3. Diminishing Returns** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐ | ⭐⭐⭐⭐ |
| **4. Escalation** | ⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐ | ⭐⭐⭐ |
| **5. Decay** | ⭐⭐⭐⭐ | ⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐ |
| **6. Asymmetric Penalty** | ⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐ | ⭐⭐⭐⭐ |
| **7. Behavioral Nudge** | ⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |

---

## Recommended Hybrid Approach ⭐

### Combined Strategy: Proportional Cap + Behavioral Nudge + Asymmetric Penalty

**Phase 1: Immediate (v3.1)** - Behavioral Nudge
- Add commitment pattern analytics to dashboard
- Show warning if 70%+ sessions are minimum commitment
- Display average commitment trend over time
- **No code changes to core calculation**, just display

**Phase 2: Near-term (v3.2)** - Proportional Cap
- Implement 50% proportional surplus cap
- Clear UI indication when surplus is capped
- Help text explaining the rationale
- Example: "Surplus capped at 1h (50% of your 2h commitment)"

**Phase 3: Future (v4.0)** - Asymmetric Penalty
- Optionally weight deficits at 1.25x
- Make this a setting users can enable
- For users who want "hard mode"

### Implementation Details

```typescript
// sessionUtils.ts additions

/**
 * Maximum surplus as proportion of commitment
 */
export const MAX_SURPLUS_RATIO = 0.5; // 50%

/**
 * Calculate session surplus with proportional cap
 */
export const getSessionBudgetBalance = (session: Session): number => {
  if (!session.targetDurationSeconds) return 0;
  
  const rawBalance = session.durationSeconds - session.targetDurationSeconds;
  
  // Only cap surpluses, never deficits
  if (rawBalance > 0) {
    const maxSurplus = session.targetDurationSeconds * MAX_SURPLUS_RATIO;
    return Math.min(rawBalance, maxSurplus);
  }
  
  return rawBalance; // Deficit: no cap
};

/**
 * Analyze commitment patterns for gaming detection
 */
export const analyzeCommitmentPatterns = (sessions: Session[]): {
  averageCommitment: number;
  minimumCommitmentRatio: number;
  hasLowCommitmentPattern: boolean;
} => {
  if (sessions.length === 0) {
    return { averageCommitment: 0, minimumCommitmentRatio: 0, hasLowCommitmentPattern: false };
  }

  const MIN_COMMITMENT = 30 * 60; // 30 minutes in seconds
  const sessionsWithCommitment = sessions.filter(s => s.targetDurationSeconds);
  
  if (sessionsWithCommitment.length === 0) {
    return { averageCommitment: 0, minimumCommitmentRatio: 0, hasLowCommitmentPattern: false };
  }

  const totalCommitment = sessionsWithCommitment.reduce(
    (sum, s) => sum + (s.targetDurationSeconds || 0), 
    0
  );
  const averageCommitment = totalCommitment / sessionsWithCommitment.length;

  const minCommitmentCount = sessionsWithCommitment.filter(
    s => s.targetDurationSeconds === MIN_COMMITMENT
  ).length;
  const minimumCommitmentRatio = minCommitmentCount / sessionsWithCommitment.length;

  // Flag if 70%+ sessions are minimum commitment AND user has 10+ sessions
  const hasLowCommitmentPattern = 
    minimumCommitmentRatio > 0.7 && sessionsWithCommitment.length >= 10;

  return {
    averageCommitment,
    minimumCommitmentRatio,
    hasLowCommitmentPattern,
  };
};
```

### UI Changes

**Dashboard Warning Card** (when pattern detected):
```
⚠️ COMMITMENT PATTERN ALERT
70% of your sessions use the minimum commitment (30m).
Consider higher pre-commitments to build genuine alpha.

Current average: 35 minutes
Suggested average: 60+ minutes
```

**Surplus Capped Indicator** (in session log):
```
Session: 3h (committed: 2h)
✓ Logged +1h surplus (capped at 50% of commitment)
Note: Raw surplus was +1h, maximum allowed surplus is +1h
```

---

## Alternative: No Action (Devil's Advocate)

### Argument Against Policing

**Counterpoint**: Maybe gaming isn't actually a problem?

1. **Self-Punishment**: Users gaming the system only hurt themselves
2. **Learning Opportunity**: Discovering that gaming doesn't work is valuable
3. **Intrinsic Motivation**: Those who need to game won't succeed anyway
4. **Complexity Cost**: Rules add friction for honest users
5. **Trust Users**: Radical honesty means trusting users to be honest

**Philosophy**: "The scoreboard doesn't lie. If you lie to it, you only lie to yourself."

**Recommendation**: Keep it simple, let natural consequences teach the lesson.

---

## Testing Considerations

If implementing surplus caps, comprehensive tests needed:

```typescript
describe('Surplus Cap', () => {
  it('should cap surplus at 50% of commitment', () => {
    const session = {
      targetDurationSeconds: 7200, // 2h
      durationSeconds: 14400, // 4h
    };
    const balance = getSessionBudgetBalance(session);
    expect(balance).toBe(3600); // Capped at 1h, not 2h
  });

  it('should not cap deficits', () => {
    const session = {
      targetDurationSeconds: 7200, // 2h
      durationSeconds: 3600, // 1h
    };
    const balance = getSessionBudgetBalance(session);
    expect(balance).toBe(-3600); // Full -1h deficit
  });

  it('should detect low commitment patterns', () => {
    const sessions = Array(10).fill(null).map(() => ({
      targetDurationSeconds: 1800, // All 30m
      durationSeconds: 3600,
    }));
    const analysis = analyzeCommitmentPatterns(sessions);
    expect(analysis.hasLowCommitmentPattern).toBe(true);
  });
});
```

---

## Migration & Communication

If implementing caps:

1. **Announce Change**: Blog post / release notes explaining rationale
2. **Grandfather Clause**: Existing surpluses remain, new rules for future sessions
3. **UI Education**: Tooltip explaining the cap when displayed
4. **Settings Toggle**: Advanced users can disable cap (at own risk)
5. **A/B Test**: Try with subset of users first

---

## Conclusion

**Primary Recommendation**: Implement **Proportional Surplus Cap (50%)** + **Behavioral Nudge**

**Rationale**:
- Balances prevention with fairness
- Rewards higher commitments
- Still allows meaningful overperformance
- Non-punitive educational component
- Aligns with protocol philosophy

**Timeline**:
- Phase 1 (Nudge): 2-3 days implementation
- Phase 2 (Cap): 1 week implementation + testing
- Phase 3 (Optional): Future consideration

**Risk Level**: Low
- Backward compatible (only affects new sessions)
- Can be toggled via setting if users object
- Existing tests provide safety net

**Next Steps**:
1. Validate approach with user feedback
2. Create test suite for new calculations
3. Implement behavioral nudge first (low risk)
4. Monitor for 2 weeks before implementing cap
5. Iterate based on user response

---

**Document Status**: ✅ Complete - Ready for Review
**Created**: 2024-12-09
**Author**: GitHub Copilot - Planning Agent
