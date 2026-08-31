import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  Unique,
  JoinColumn,
} from 'typeorm';

@Entity()
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  username: string;

  @Column({ unique: true })
  email: string;

  @Column()
  passwordHash: string;

  @Column({ default: 'client' })
  role: string;

  @Column({ nullable: true })
  displayName: string;

  @CreateDateColumn()
  createdAt: Date;

  @OneToMany(() => Rental, (r) => r.user)
  rentals?: Rental[];
}

@Entity()
export class Rack {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  slug: string;

  @Column()
  name: string;

  @Column({ default: '' })
  tagline: string;

  @Column({ default: '' })
  photoUrl: string;

  @Column({ type: 'int', default: 0 })
  sortOrder: number;

  @Column({ type: 'simple-json', nullable: true })
  tags: string[];

  @OneToMany(() => Piece, (p) => p.rack)
  pieces?: Piece[];
}

@Entity()
export class Piece {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  rackId: string;

  @ManyToOne(() => Rack, (r) => r.pieces, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'rackId' })
  rack?: Rack;

  @Column()
  name: string;

  @Column({ default: 'único' })
  sizeLabel: string;

  @Column({ type: 'int' })
  dailyRateCents: number;

  @Column({ type: 'int' })
  depositCents: number;

  @Column({ default: '' })
  photoUrl: string;

  @Column({ type: 'simple-json', nullable: true })
  fabricNotes: Record<string, string>;

  @Column({ default: true })
  active: boolean;

  @OneToMany(() => RentalLine, (l) => l.piece)
  lines?: RentalLine[];
}

@Entity()
export class Addon {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  slug: string;

  @Column()
  name: string;

  @Column({ type: 'int' })
  priceCents: number;
}

@Entity()
export class Rental {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @ManyToOne(() => User, (u) => u.rentals, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user?: User;

  @Column({ unique: true })
  code: string;

  @Column({ type: 'varchar' })
  startOn: string;

  @Column({ type: 'varchar' })
  endOn: string;

  @Column()
  status: string;

  @Column({ type: 'int' })
  depositCents: number;

  @Column({ type: 'int', default: 0 })
  lateFeeCents: number;

  @Column({ default: false })
  depositReleased: boolean;

  @Column({ type: 'int' })
  totalCents: number;

  @CreateDateColumn()
  createdAt: Date;

  @Column({ type: 'datetime', nullable: true })
  cancelledAt: Date | null;

  @OneToMany(() => RentalLine, (l) => l.rental)
  lines?: RentalLine[];

  @OneToMany(() => RentalAddon, (a) => a.rental)
  addons?: RentalAddon[];

  @OneToMany(() => ScanEvent, (s) => s.rental)
  scans?: ScanEvent[];
}

@Entity()
export class RentalLine {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  rentalId: string;

  @ManyToOne(() => Rental, (r) => r.lines, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'rentalId' })
  rental?: Rental;

  @Column()
  pieceId: string;

  @ManyToOne(() => Piece, (p) => p.lines, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'pieceId' })
  piece?: Piece;

  @Column({ type: 'int' })
  dailyRateCents: number;

  @Column({ type: 'int' })
  days: number;

  @Column({ type: 'int' })
  lineTotalCents: number;
}

@Entity()
@Unique(['rentalId', 'addonId'])
export class RentalAddon {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  rentalId: string;

  @ManyToOne(() => Rental, (r) => r.addons, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'rentalId' })
  rental?: Rental;

  @Column()
  addonId: string;

  @ManyToOne(() => Addon, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'addonId' })
  addon?: Addon;

  @Column({ type: 'int' })
  priceCents: number;
}

@Entity()
@Unique(['userId', 'pieceId'])
export class Review {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user?: User;

  @Column()
  pieceId: string;

  @ManyToOne(() => Piece, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'pieceId' })
  piece?: Piece;

  @Column({ type: 'int' })
  rating: number;

  @Column({ type: 'text', nullable: true })
  body: string | null;

  @CreateDateColumn()
  createdAt: Date;
}

@Entity()
export class ScanEvent {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  rentalId: string;

  @ManyToOne(() => Rental, (r) => r.scans, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'rentalId' })
  rental?: Rental;

  @Column()
  staffId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'staffId' })
  staff?: User;

  @Column()
  kind: string;

  @CreateDateColumn()
  createdAt: Date;
}

export const ALL_ENTITIES = [
  User,
  Rack,
  Piece,
  Addon,
  Rental,
  RentalLine,
  RentalAddon,
  Review,
  ScanEvent,
];
