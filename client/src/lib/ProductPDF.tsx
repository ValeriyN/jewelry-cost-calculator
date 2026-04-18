import { Document, Page, Text, View, Image, StyleSheet } from "@react-pdf/renderer";
import type { ProductDetail } from "@jewelry/shared";

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: "Helvetica",
    fontSize: 11,
    color: "#1a1a1a",
  },
  header: {
    marginBottom: 24,
    borderBottomWidth: 2,
    borderBottomColor: "#c026d3",
    paddingBottom: 16,
  },
  title: {
    fontSize: 24,
    fontFamily: "Helvetica-Bold",
    color: "#111827",
    marginBottom: 4,
  },
  photo: {
    width: "100%",
    maxHeight: 280,
    objectFit: "cover",
    borderRadius: 8,
    marginBottom: 20,
  },
  priceGrid: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 24,
  },
  priceBox: {
    flex: 1,
    backgroundColor: "#f9fafb",
    borderRadius: 8,
    padding: 12,
  },
  priceBoxHighlight: {
    flex: 1,
    backgroundColor: "#fae8ff",
    borderRadius: 8,
    padding: 12,
  },
  priceLabel: {
    fontSize: 9,
    color: "#6b7280",
    marginBottom: 4,
  },
  priceValue: {
    fontSize: 18,
    fontFamily: "Helvetica-Bold",
    color: "#111827",
  },
  priceValueHighlight: {
    fontSize: 18,
    fontFamily: "Helvetica-Bold",
    color: "#a21caf",
  },
  sectionTitle: {
    fontSize: 12,
    fontFamily: "Helvetica-Bold",
    color: "#374151",
    marginBottom: 8,
    marginTop: 4,
  },
  componentRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  componentName: {
    fontSize: 10,
    color: "#374151",
    flex: 1,
  },
  componentQty: {
    fontSize: 10,
    color: "#6b7280",
    textAlign: "right",
  },
  footer: {
    marginTop: 24,
    fontSize: 8,
    color: "#9ca3af",
    textAlign: "center",
  },
});

interface Props {
  product: ProductDetail;
}

export default function ProductPDF({ product }: Props) {
  return (
    <Document title={product.name}>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>{product.name}</Text>
        </View>

        {/* Photo */}
        {product.photoPath && (
          <Image src={`/uploads/${product.photoPath}`} style={styles.photo} />
        )}

        {/* Price summary */}
        <View style={styles.priceGrid}>
          <View style={styles.priceBox}>
            <Text style={styles.priceLabel}>Собівартість</Text>
            <Text style={styles.priceValue}>{product.totalCost.toFixed(2)} грн</Text>
          </View>
          <View style={styles.priceBoxHighlight}>
            <Text style={styles.priceLabel}>Рекомендована ціна</Text>
            <Text style={styles.priceValueHighlight}>
              {product.recommendedPrice.toFixed(2)} грн
            </Text>
          </View>
        </View>

        {/* Components list — no unit prices */}
        <Text style={styles.sectionTitle}>Склад виробу</Text>
        {product.components.map((comp, idx) => (
          <View key={idx} style={styles.componentRow}>
            <Text style={styles.componentName}>{comp.componentName}</Text>
            <Text style={styles.componentQty}>{comp.quantity} шт.</Text>
          </View>
        ))}

        <Text style={styles.footer}>
          Сформовано {new Date().toLocaleDateString("uk-UA")}
        </Text>
      </Page>
    </Document>
  );
}
