export interface Milestone {
  url: string
  achievedDate: Date
  count: number
}

export interface MilestoneService {
    getLastMilestone(url: string): Promise<Milestone | undefined>

    saveMilestone(milestone: Milestone): Promise<void>
}
