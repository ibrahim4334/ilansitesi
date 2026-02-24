// src/modules/reviews/domain/Review.ts

export type ReviewStatus = "PENDING" | "APPROVED" | "REJECTED";

export interface ReviewProps {
  id?: string;
  guideId: string;
  reviewerUserId: string;
  requestId: string;

  ratingCommunication: number;
  ratingKnowledge: number;
  ratingOrganization: number;
  ratingTimeManagement: number;
  overallRating?: number;

  positiveTags: string[];
  negativeTags: string[];

  comment?: string | null;
  status?: ReviewStatus;
  isVerified?: boolean;

  ipHash?: string | null;
  userAgentHash?: string | null;

  createdAt?: Date;
  approvedAt?: Date | null;
  deletedAt?: Date | null;
}

export class Review {
  private props: ReviewProps;

  private constructor(props: ReviewProps) {
    this.props = {
      ...props,
      // Calculate overall rating if it doesn't exist yet
      overallRating:
        props.overallRating !== undefined
          ? props.overallRating
          : this.calculateOverallRating(
              props.ratingCommunication,
              props.ratingKnowledge,
              props.ratingOrganization,
              props.ratingTimeManagement
            ),
      status: props.status ?? "APPROVED",
      isVerified: props.isVerified ?? true,
      createdAt: props.createdAt ?? new Date(),
    };
  }

  public static create(props: ReviewProps): Review {
    return new Review(props);
  }

  private calculateOverallRating(
    comm: number,
    knowledge: number,
    org: number,
    time: number
  ): number {
    const avg = (comm + knowledge + org + time) / 4;
    return Number(avg.toFixed(1));
  }

  // Getters
  public get id(): string | undefined { return this.props.id; }
  public get guideId(): string { return this.props.guideId; }
  public get reviewerUserId(): string { return this.props.reviewerUserId; }
  public get requestId(): string { return this.props.requestId; }

  public get ratingCommunication(): number { return this.props.ratingCommunication; }
  public get ratingKnowledge(): number { return this.props.ratingKnowledge; }
  public get ratingOrganization(): number { return this.props.ratingOrganization; }
  public get ratingTimeManagement(): number { return this.props.ratingTimeManagement; }
  public get overallRating(): number { return this.props.overallRating as number; }

  public get positiveTags(): string[] { return this.props.positiveTags; }
  public get negativeTags(): string[] { return this.props.negativeTags; }
  
  public get comment(): string | null { return this.props.comment ?? null; }
  public get status(): ReviewStatus { return this.props.status as ReviewStatus; }
  public get isVerified(): boolean { return this.props.isVerified as boolean; }
  
  public get ipHash(): string | null { return this.props.ipHash ?? null; }
  public get userAgentHash(): string | null { return this.props.userAgentHash ?? null; }
  
  public get createdAt(): Date { return this.props.createdAt as Date; }
  public get approvedAt(): Date | null { return this.props.approvedAt ?? null; }
  public get deletedAt(): Date | null { return this.props.deletedAt ?? null; }

  // Setters
  public markAsPending(): void {
    this.props.status = "PENDING";
  }

  public approve(): void {
    this.props.status = "APPROVED";
    this.props.approvedAt = new Date();
  }

  public reject(): void {
    this.props.status = "REJECTED";
  }

  public softDelete(): void {
    this.props.deletedAt = new Date();
  }

  public toJSON() {
    return { ...this.props };
  }
}
