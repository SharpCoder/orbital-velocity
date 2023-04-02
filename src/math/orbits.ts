export type OrbitalParameters = {
    epoch: number; // t (julian date)
    inclination: number;
    ra: number;
    argumentOfPerigee: number; // ω
    eccentricity: number; // e
    meanMotion: number;
    semimajorAxis: number; // a
    meanAnomaly: number; //
};
