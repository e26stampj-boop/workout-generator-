interface Props {
  rating: number;
  onChange?: (rating: number) => void;
  readonly?: boolean;
}

export default function RatingStars({
  rating,
  onChange,
  readonly = false,
}: Props) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => !readonly && onChange?.(star)}
          disabled={readonly}
          className={`min-h-11 min-w-11 text-2xl ${
            star <= rating ? "text-yellow-400" : "text-gray-300"
          } ${!readonly ? "cursor-pointer hover:text-yellow-500" : "cursor-default"}`}
          aria-label={`Rate ${star} star${star > 1 ? "s" : ""}`}
        >
          ★
        </button>
      ))}
    </div>
  );
}
