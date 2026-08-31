import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { Addon, Piece, Rack, Rental, RentalAddon, RentalLine, User } from '../entities/entities';
import { addDays, daysInclusive, madridToday } from '../util/dates';

@Injectable()
export class SeedService implements OnModuleInit {
  constructor(
    @InjectRepository(User) private readonly users: Repository<User>,
    @InjectRepository(Rack) private readonly racks: Repository<Rack>,
    @InjectRepository(Piece) private readonly pieces: Repository<Piece>,
    @InjectRepository(Addon) private readonly addons: Repository<Addon>,
    @InjectRepository(Rental) private readonly rentals: Repository<Rental>,
    @InjectRepository(RentalLine) private readonly lines: Repository<RentalLine>,
    @InjectRepository(RentalAddon) private readonly rentalAddons: Repository<RentalAddon>,
  ) {}

  async onModuleInit() {
    if (process.env.SEED_DB === 'false') return;
    if (await this.users.count()) return;
    await this.seed();
  }

  async seed() {
    const hash = await bcrypt.hash('demo1234', 10);
    const demo = (await this.users.save({
      username: 'demo',
      email: 'demo@bambalina.dev',
      passwordHash: hash,
      role: 'client',
      displayName: 'Lola Cuevas',
    } as any)) as User;
    const staff = (await this.users.save({
      username: 'percha',
      email: 'staff@bambalina.dev',
      passwordHash: hash,
      role: 'staff',
      displayName: 'Marisa Percha',
    } as any)) as User;
    const other = (await this.users.save({
      username: 'compania',
      email: 'compania@bambalina.dev',
      passwordHash: hash,
      role: 'client',
      displayName: 'Compañía Nueve',
    } as any)) as User;
    void staff;

    const rackDefs = [
      {
        slug: 'siglo-oro',
        name: 'Siglo de Oro',
        tagline: 'Golas, gregüescos y capa de paño para verso mayor.',
        photoUrl: '/assets/camerino-oro.svg',
        sortOrder: 1,
        tags: ['verso', 'capa', 'gola'],
      },
      {
        slug: 'zarzuela',
        name: 'Zarzuela de salón',
        tagline: 'Mantón, peineta y frac de cuplé para el patio de butacas.',
        photoUrl: '/assets/camerino-zarzuela.svg',
        sortOrder: 2,
        tags: ['mantón', 'cuplé'],
      },
      {
        slug: 'carton-espacial',
        name: 'Cartón espacial',
        tagline: 'Cascos de cartulina plateada y capas de ducha galáctica.',
        photoUrl: '/assets/camerino-carton.svg',
        sortOrder: 3,
        tags: ['sci-fi', 'colegio'],
      },
      {
        slug: 'comparsa',
        name: 'Comparsa de febrero',
        tagline: 'Lentejuela, pompón y capa de raso que sobrevive a la comparsa.',
        photoUrl: '/assets/camerino-comparsa.svg',
        sortOrder: 4,
        tags: ['carnaval', 'lentejuela'],
      },
    ];
    const racks: Rack[] = [];
    for (const def of rackDefs) {
      racks.push((await this.racks.save(def as any)) as Rack);
    }

    const pieceDefs: Array<{
      rack: number;
      name: string;
      size: string;
      rate: number;
      deposit: number;
      photo: string;
      fabric: Record<string, string>;
    }> = [
      { rack: 0, name: 'Capa de paño granate', size: '42', rate: 1800, deposit: 4000, photo: '/assets/percha-capa.svg', fabric: { tejido: 'paño de lana', epoca: '1600', cuidados: 'cepillo en seco' } },
      { rack: 0, name: 'Gola almidonada', size: 'único', rate: 900, deposit: 1500, photo: '/assets/percha-gola.svg', fabric: { tejido: 'lino almidonado', epoca: '1620', cuidados: 'no doblar' } },
      { rack: 0, name: 'Gregüescos de raso', size: '40', rate: 1400, deposit: 2500, photo: '/assets/percha-greguescos.svg', fabric: { tejido: 'raso', epoca: '1610', cuidados: 'plancha baja' } },
      { rack: 1, name: 'Mantón de manila teja', size: 'único', rate: 2200, deposit: 5000, photo: '/assets/percha-manton.svg', fabric: { tejido: 'seda bordada', epoca: '1905', cuidados: 'colgar, no plegar' } },
      { rack: 1, name: 'Peineta de nácar', size: 'único', rate: 700, deposit: 2000, photo: '/assets/percha-peineta.svg', fabric: { tejido: 'celuloide nácar', epoca: '1920', cuidados: 'caja rígida' } },
      { rack: 1, name: 'Frac de cuplé negro', size: '50', rate: 1600, deposit: 3500, photo: '/assets/percha-frac.svg', fabric: { tejido: 'estameña', epoca: '1912', cuidados: 'percha ancha' } },
      { rack: 2, name: 'Casco de cartulina plata', size: '54', rate: 600, deposit: 800, photo: '/assets/percha-casco.svg', fabric: { tejido: 'cartón plateado', epoca: '1984', cuidados: 'no mojar' } },
      { rack: 2, name: 'Capa de ducha galáctica', size: 'único', rate: 500, deposit: 600, photo: '/assets/percha-ducha.svg', fabric: { tejido: 'hule iridiscente', epoca: '1984', cuidados: 'secar al aire' } },
      { rack: 2, name: 'Botas de astronauta de goma', size: '38', rate: 800, deposit: 1000, photo: '/assets/percha-botas.svg', fabric: { tejido: 'goma pintada', epoca: '1984', cuidados: 'polvo de talco' } },
      { rack: 3, name: 'Capa de raso comparsa', size: 'único', rate: 1200, deposit: 1800, photo: '/assets/percha-raso.svg', fabric: { tejido: 'raso de acetato', epoca: 'hoy', cuidados: 'lentejuela frágil' } },
      { rack: 3, name: 'Chaqueta de pompón', size: '44', rate: 1100, deposit: 1600, photo: '/assets/percha-pompon.svg', fabric: { tejido: 'punto y pompón', epoca: 'hoy', cuidados: 'no centrifugar' } },
      { rack: 3, name: 'Sombrero de lentejuela', size: 'único', rate: 650, deposit: 900, photo: '/assets/percha-sombrero.svg', fabric: { tejido: 'fieltro + lentejuela', epoca: 'hoy', cuidados: 'caja de sombrero' } },
    ];
    const pieces: Piece[] = [];
    for (const def of pieceDefs) {
      pieces.push(
        (await this.pieces.save({
          rackId: racks[def.rack].id,
          name: def.name,
          sizeLabel: def.size,
          dailyRateCents: def.rate,
          depositCents: def.deposit,
          photoUrl: def.photo,
          fabricNotes: def.fabric,
          active: true,
        } as any)) as Piece,
      );
    }

    const addonDefs = [
      { slug: 'apresto', name: 'Apresto de gola', priceCents: 400 },
      { slug: 'seguro', name: 'Seguro de descosido', priceCents: 600 },
      { slug: 'caja-sombrero', name: 'Caja de sombrero', priceCents: 350 },
    ];
    const addons: Addon[] = [];
    for (const def of addonDefs) {
      addons.push((await this.addons.save(def as any)) as Addon);
    }

    const today = madridToday();
    const pastStart = addDays(today, -10);
    const pastEnd = addDays(today, -7);
    const liveStart = addDays(today, 3);
    const liveEnd = addDays(today, 5);
    const holdStart = addDays(today, 1);
    const holdEnd = addDays(today, 2);
    const otherStart = addDays(today, 8);
    const otherEnd = addDays(today, 10);

    await this.saveRental({
      userId: demo.id,
      code: 'DEVUELTA1',
      startOn: pastStart,
      endOn: pastEnd,
      status: 'returned',
      piece: pieces[0],
      addon: addons[1],
      depositReleased: true,
    });
    await this.saveRental({
      userId: demo.id,
      code: 'PAGADA01',
      startOn: liveStart,
      endOn: liveEnd,
      status: 'paid',
      piece: pieces[3],
      addon: addons[0],
      depositReleased: false,
    });
    await this.saveRental({
      userId: demo.id,
      code: 'SALIDA01',
      startOn: holdStart,
      endOn: holdEnd,
      status: 'picked_up',
      piece: pieces[6],
      addon: null,
      depositReleased: false,
    });
    await this.saveRental({
      userId: other.id,
      code: 'AJENA001',
      startOn: otherStart,
      endOn: otherEnd,
      status: 'paid',
      piece: pieces[9],
      addon: addons[2],
      depositReleased: false,
    });
  }

  private async saveRental(opts: {
    userId: string;
    code: string;
    startOn: string;
    endOn: string;
    status: string;
    piece: Piece;
    addon: Addon | null;
    depositReleased: boolean;
  }) {
    const days = daysInclusive(opts.startOn, opts.endOn);
    const lineTotal = opts.piece.dailyRateCents * days;
    const addonCents = opts.addon ? opts.addon.priceCents : 0;
    const lateFeeCents = 0;
    const totalCents = lineTotal + addonCents + opts.piece.depositCents + lateFeeCents;
    const rental = (await this.rentals.save({
      userId: opts.userId,
      code: opts.code,
      startOn: opts.startOn,
      endOn: opts.endOn,
      status: opts.status,
      depositCents: opts.piece.depositCents,
      lateFeeCents,
      depositReleased: opts.depositReleased,
      totalCents,
      cancelledAt: null,
    } as any)) as Rental;
    await this.lines.save({
      rentalId: rental.id,
      pieceId: opts.piece.id,
      dailyRateCents: opts.piece.dailyRateCents,
      days,
      lineTotalCents: lineTotal,
    } as any);
    if (opts.addon) {
      await this.rentalAddons.save({
        rentalId: rental.id,
        addonId: opts.addon.id,
        priceCents: opts.addon.priceCents,
      } as any);
    }
    return rental;
  }
}
