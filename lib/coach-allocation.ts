export const COACH_CAPACITY = 53

export interface PickupAllocationInput {
  address: string
  passengers: number
}

export interface CoachPickupAllocation {
  address: string
  passengers: number
}

export interface CoachPlan {
  coachNumber: number
  passengers: number
  pickups: CoachPickupAllocation[]
}

export function allocateCoaches(
  pickups: PickupAllocationInput[],
  capacity = COACH_CAPACITY,
): CoachPlan[] {
  if (!Number.isFinite(capacity) || capacity < 1) {
    throw new RangeError('capacity must be at least 1')
  }

  const validPickups = pickups.map((pickup) => {
    if (!pickup.address.trim()) throw new RangeError('pickup address is required')
    if (!Number.isInteger(pickup.passengers) || pickup.passengers < 0) {
      throw new RangeError('pickup passengers must be a non-negative integer')
    }
    return pickup
  }).filter((pickup) => pickup.passengers > 0)

  if (validPickups.every((pickup) => pickup.passengers <= capacity)) {
    const partitioned = partitionWholePickups(validPickups, capacity)
    if (partitioned) return partitioned
  }

  const plans: CoachPlan[] = []
  let current: CoachPlan | null = null

  const ensureCoach = () => {
    if (!current || current.passengers >= capacity) {
      current = { coachNumber: plans.length + 1, passengers: 0, pickups: [] }
      plans.push(current)
    }
    return current
  }

  for (const pickup of validPickups) {
    let remaining = pickup.passengers
    while (remaining > 0) {
      const coach = ensureCoach()
      const available = capacity - coach.passengers
      const taking = Math.min(remaining, available)

      coach.pickups.push({ address: pickup.address, passengers: taking })
      coach.passengers += taking
      remaining -= taking
    }
  }

  return plans.filter((plan) => plan.passengers > 0)
}

function partitionWholePickups(
  pickups: PickupAllocationInput[],
  capacity: number,
): CoachPlan[] | null {
  const totalPassengers = pickups.reduce((sum, pickup) => sum + pickup.passengers, 0)
  if (totalPassengers === 0) return []

  const coachCount = Math.ceil(totalPassengers / capacity)
  if (coachCount > pickups.length) return null

  let best: PickupAllocationInput[][] | null = null
  let bestScore = Number.POSITIVE_INFINITY

  function score(groups: PickupAllocationInput[][]): number {
    const loads = groups.map((group) => group.reduce((sum, pickup) => sum + pickup.passengers, 0))
    const maxLoad = Math.max(...loads)
    const minLoad = Math.min(...loads)
    return maxLoad * 1000 + (maxLoad - minLoad)
  }

  function visit(startIndex: number, remainingGroups: number, groups: PickupAllocationInput[][]) {
    if (remainingGroups === 0) {
      if (startIndex !== pickups.length) return
      const currentScore = score(groups)
      if (currentScore < bestScore) {
        bestScore = currentScore
        best = groups
      }
      return
    }

    let passengers = 0
    const maxEnd = pickups.length - remainingGroups + 1
    for (let end = startIndex + 1; end <= maxEnd; end++) {
      passengers += pickups[end - 1].passengers
      if (passengers > capacity) break
      visit(end, remainingGroups - 1, [...groups, pickups.slice(startIndex, end)])
    }
  }

  visit(0, coachCount, [])
  if (!best) return null

  const bestGroups: PickupAllocationInput[][] = best

  return bestGroups.map((group, i) => ({
    coachNumber: i + 1,
    passengers: group.reduce((sum, pickup) => sum + pickup.passengers, 0),
    pickups: group.map((pickup) => ({
      address: pickup.address,
      passengers: pickup.passengers,
    })),
  }))
}

export function buildSingleCoachPlans(addresses: string[], totalPassengers: number): CoachPlan[] {
  if (!Number.isInteger(totalPassengers) || totalPassengers < 1) {
    throw new RangeError('totalPassengers must be at least 1')
  }

  const coachCount = Math.ceil(totalPassengers / COACH_CAPACITY)
  return Array.from({ length: coachCount }, (_, i) => {
    const remaining = totalPassengers - i * COACH_CAPACITY
    return {
      coachNumber: i + 1,
      passengers: Math.min(COACH_CAPACITY, remaining),
      pickups: addresses.map((address, addressIndex) => ({
        address,
        passengers: addressIndex === 0 ? Math.min(COACH_CAPACITY, remaining) : 0,
      })),
    }
  })
}

export function routeForCoach(plan: CoachPlan, destination: string): string[] {
  const addresses = Array.from(new Set(plan.pickups.map((pickup) => pickup.address)))
  return [...addresses, destination]
}

export function returnRouteForCoach(plan: CoachPlan, destination: string): string[] {
  const addresses = Array.from(new Set(plan.pickups.map((pickup) => pickup.address))).reverse()
  return [destination, ...addresses]
}
