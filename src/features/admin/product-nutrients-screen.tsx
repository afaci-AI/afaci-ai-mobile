import { AdminProductDetailScreen } from './product-detail-screen'

/** Second step after product creation; uses the same saved nutrient CRUD. */
export default function ProductNutrientsScreen() {
  return <AdminProductDetailScreen fillNutrients />
}
