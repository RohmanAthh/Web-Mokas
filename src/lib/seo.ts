// Helper SEO: URL dasar & data terstruktur schema.org.
import type { Car } from "./car-utils";
import { site } from "./site";

export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");

const abs = (p: string) => (p.startsWith("http") ? p : `${SITE_URL}${p}`);

const FUEL_EN: Record<string, string> = { Bensin: "Gasoline", Diesel: "Diesel", Hybrid: "Hybrid", Listrik: "Electric" };

/** schema.org Car + Offer — membantu harga & ketersediaan tampil di hasil Google. */
export function carJsonLd(car: Car, images: string[]) {
  return {
    "@context": "https://schema.org",
    "@type": "Car",
    name: `${car.brand} ${car.model} ${car.variant} ${car.year}`.replace(/\s+/g, " "),
    brand: { "@type": "Brand", name: car.brand },
    model: car.model,
    vehicleConfiguration: car.variant || undefined,
    vehicleModelDate: String(car.year),
    bodyType: car.body_type,
    color: car.color || undefined,
    fuelType: FUEL_EN[car.fuel] ?? car.fuel,
    vehicleTransmission: car.transmission === "Otomatis" ? "Automatic" : "Manual",
    seatingCapacity: car.seats,
    mileageFromOdometer: { "@type": "QuantitativeValue", value: car.mileage, unitCode: "KMT" },
    vehicleEngine: car.engine_cc ? { "@type": "EngineSpecification", engineDisplacement: { "@type": "QuantitativeValue", value: car.engine_cc, unitCode: "CMQ" } } : undefined,
    itemCondition: "https://schema.org/UsedCondition",
    image: images.map(abs),
    description: car.description.slice(0, 500),
    url: abs(`/mobil/${car.slug}`),
    offers: {
      "@type": "Offer",
      price: car.price,
      priceCurrency: "IDR",
      availability: car.status === "sold" ? "https://schema.org/SoldOut" : car.status === "booked" ? "https://schema.org/LimitedAvailability" : "https://schema.org/InStock",
      itemCondition: "https://schema.org/UsedCondition",
      seller: { "@type": "AutoDealer", name: site.name },
    },
  };
}

/** schema.org AutoDealer untuk beranda. */
export function dealerJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "AutoDealer",
    name: site.name,
    description: site.description,
    url: SITE_URL,
    telephone: site.phone,
    email: site.email,
    address: { "@type": "PostalAddress", streetAddress: site.address, addressCountry: "ID" },
    openingHours: ["Mo-Sa 09:00-18:00", "Su 10:00-15:00"],
  };
}
