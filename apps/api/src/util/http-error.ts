import { BadRequestException, ConflictException } from '@nestjs/common';

const COPY: Record<string, string> = {
  PIECE_TAKEN: 'Esa prenda ya cuelga en otro guardarropa esas fechas. Elige otra o mueve los días.',
  ALREADY_RENTING: 'Ya tienes esta prenda en esas fechas. Ábrela en Mis alquileres.',
  DATE_INVALID: 'Elige un rango de 1 a 14 días, con devolución el mismo día o después.',
  TOO_MANY_PIECES: 'Máximo 4 prendas por alquiler.',
  TOO_LATE: 'Faltan menos de 24 h; no se puede cancelar.',
  ALREADY_PICKED_UP: 'Esta prenda ya salió de la percha.',
  NOT_PICKED_UP: 'Todavía no se ha recogido.',
  ALREADY_RETURNED: 'Esta prenda ya volvió al perchero.',
  ALREADY_REVIEWED: 'Ya contaste esta prenda.',
  NO_PIECES: 'Elige al menos una prenda.',
  NOT_RETURNED: 'Solo se puede reseñar una prenda después de devolverla.',
};

export function conflict(code: string) {
  return new ConflictException({ code, message: COPY[code] || code });
}

export function badRequest(code: string) {
  return new BadRequestException({ code, message: COPY[code] || code });
}
