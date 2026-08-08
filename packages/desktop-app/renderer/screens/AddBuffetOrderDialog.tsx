import { useEffect, useState } from "react";
import { formatTomanWithSeparators } from "../../../core/src/localization/CurrencyFormatter";
import "./create-open-tab-dialog.css";
import "./add-buffet-order-dialog.css";

interface Product {
  id: string;
  name: string;
  salePrice: number;
  stockQuantity: number;
}

interface AddBuffetOrderDialogProps {
  openTabId: string;
  onAdded: () => void;
  onCancel: () => void;
}

export function AddBuffetOrderDialog({ openTabId, onAdded, onCancel }: AddBuffetOrderDialogProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    window.arthurClub.listProducts().then(setProducts);
  }, []);

  const selectedItems = Object.entries(quantities).filter(([, quantity]) => quantity > 0);
  const totalAmount = selectedItems.reduce((sum, [productId, quantity]) => {
    const product = products.find((candidate) => candidate.id === productId);
    return sum + (product ? product.salePrice * quantity : 0);
  }, 0);

  async function submit() {
    setErrorMessage(null);
    setIsSubmitting(true);
    try {
      await window.arthurClub.createBuffetOrder({
        items: selectedItems.map(([productId, quantity]) => ({ productId, quantity })),
        openTabId,
        isPaidImmediately: false,
      });
      onAdded();
    } catch (error) {
      setErrorMessage("ثبت سفارش با خطا مواجه شد. موجودی را بررسی کنید.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="create-open-tab-dialog__overlay">
      <div className="create-open-tab-dialog add-buffet-order-dialog">
        <h2 className="create-open-tab-dialog__title">افزودن از بوفه</h2>

        <div className="add-buffet-order-dialog__list">
          {products.map((product) => (
            <div key={product.id} className="add-buffet-order-dialog__row">
              <span className="add-buffet-order-dialog__row-name">{product.name}</span>
              <span className="add-buffet-order-dialog__row-price">
                {formatTomanWithSeparators(product.salePrice)}
              </span>
              <input
                type="number"
                min={0}
                max={product.stockQuantity}
                className="add-buffet-order-dialog__row-input"
                value={quantities[product.id] ?? 0}
                onChange={(event) =>
                  setQuantities((current) => ({
                    ...current,
                    [product.id]: Math.max(0, Number(event.target.value)),
                  }))
                }
              />
            </div>
          ))}
          {products.length === 0 && (
            <div className="add-buffet-order-dialog__empty">محصولی در بوفه ثبت نشده است</div>
          )}
        </div>

        <p className="create-open-tab-dialog__warning">
          مبلغ کل: {formatTomanWithSeparators(totalAmount)}
        </p>

        {errorMessage && <p className="add-buffet-order-dialog__error">{errorMessage}</p>}

        <div className="create-open-tab-dialog__actions">
          <button type="button" onClick={onCancel} disabled={isSubmitting}>
            انصراف
          </button>
          <button
            type="button"
            className="create-open-tab-dialog__primary"
            onClick={submit}
            disabled={isSubmitting || selectedItems.length === 0}
          >
            افزودن به حساب
          </button>
        </div>
      </div>
    </div>
  );
}
