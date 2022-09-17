import {Milestone, MilestoneService} from "../src/milestone-service";

export class MilestoneServiceMock implements MilestoneService {
  constructor(
    private milestones: Milestone[] = []
  ) {}

  async getLastMilestone(url: string): Promise<Milestone | undefined> {
    return this.milestones.find(milestone => milestone.url === url)
  }

  async saveMilestone(milestone: Milestone): Promise<void> {
    this.milestones.push(milestone)
  }
}
