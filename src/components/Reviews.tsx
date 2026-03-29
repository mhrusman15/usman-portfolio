import { useCallback, useEffect, useState, type FormEvent } from "react";
import {
  FaChevronLeft,
  FaChevronRight,
  FaGlobe,
  FaStar,
  FaRegStar,
} from "react-icons/fa6";
import { getSupabase, isSupabaseConfigured } from "../lib/supabaseClient";
import { timeAgo } from "../lib/timeAgo";
import "./styles/Reviews.css";

const BODY_PREVIEW_LEN = 190;
const MAX_BYTES = 2 * 1024 * 1024;

type PublicReview = {
  id: string;
  created_at: string;
  name: string;
  profile_image_url: string | null;
  rating: number;
  body: string;
};

function notifyReviewSubmitted(payload: {
  name: string;
  email: string;
  rating: number;
  body_preview: string;
}) {
  const url = import.meta.env.VITE_REVIEW_NOTIFY_WEBHOOK?.trim();
  if (!url) return;
  void fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      ...payload,
      submitted_at: new Date().toISOString(),
      message: "New portfolio review pending approval",
    }),
  }).catch(() => {});
}

function StarsDisplay({ rating }: { rating: number }) {
  return (
    <div className="reviews-stars-row" aria-label={`${rating} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((i) =>
        i <= rating ? <FaStar key={i} /> : <FaRegStar key={i} />
      )}
    </div>
  );
}

function StarInput({
  value,
  onChange,
}: {
  value: number;
  onChange: (n: number) => void;
}) {
  return (
    <div className="reviews-star-input" role="group" aria-label="Rating 1 to 5">
      {[1, 2, 3, 4, 5].map((i) => (
        <button
          key={i}
          type="button"
          className={i <= value ? "is-on" : ""}
          onClick={() => onChange(i)}
          aria-pressed={i <= value}
          aria-label={`${i} star${i > 1 ? "s" : ""}`}
        >
          {i <= value ? <FaStar /> : <FaRegStar />}
        </button>
      ))}
    </div>
  );
}

function ReviewCard({
  review,
  expanded,
  onToggleExpand,
  isCompact,
}: {
  review: PublicReview;
  expanded: boolean;
  onToggleExpand: () => void;
  isCompact?: boolean;
}) {
  const long = review.body.length > BODY_PREVIEW_LEN;
  const shown =
    expanded || !long ? review.body : `${review.body.slice(0, BODY_PREVIEW_LEN)}…`;

  const initial = review.name.trim().charAt(0).toUpperCase() || "?";

  return (
    <article className="reviews-glass reviews-card">
      <div className="reviews-card-header">
        {review.profile_image_url ? (
          <img
            className="reviews-avatar"
            src={review.profile_image_url}
            alt=""
            loading="lazy"
          />
        ) : (
          <div
            className="reviews-avatar reviews-avatar-fallback"
            aria-hidden
          >
            {initial}
          </div>
        )}
        <div>
          <h4 className="reviews-card-name">{review.name}</h4>
          <StarsDisplay rating={review.rating} />
        </div>
      </div>
      <p className={`reviews-card-body ${isCompact ? "reviews-compact-body" : ""}`}>
        {shown}
        {long && (
          <button
            type="button"
            className="reviews-show-more"
            onClick={onToggleExpand}
          >
            {expanded ? "Show less" : "Show more"}
          </button>
        )}
      </p>
      <div className="reviews-card-footer">
        <span className="reviews-footer-source">
          <FaGlobe aria-hidden />
          Portfolio review
        </span>
        <time dateTime={review.created_at}>{timeAgo(review.created_at)}</time>
      </div>
    </article>
  );
}

const Reviews = () => {
  const configured = isSupabaseConfigured();
  const [reviews, setReviews] = useState<PublicReview[]>([]);
  const [loading, setLoading] = useState(configured);
  const [index, setIndex] = useState(0);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [rating, setRating] = useState(5);
  const [body, setBody] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formMsg, setFormMsg] = useState<{ type: "ok" | "err"; text: string } | null>(
    null
  );

  const loadReviews = useCallback(async () => {
    const sb = getSupabase();
    if (!sb) {
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data, error } = await sb
      .from("reviews")
      .select("id, created_at, name, profile_image_url, rating, body")
      .eq("status", "approved")
      .order("created_at", { ascending: false });

    if (error) {
      setReviews([]);
    } else {
      setReviews((data as PublicReview[]) ?? []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    void loadReviews();
  }, [loadReviews]);

  useEffect(() => {
    setIndex(0);
  }, [reviews.length]);

  const n = reviews.length;
  const canNav = n > 1;

  const prev = () => setIndex((i) => (i - 1 + n) % n);
  const next = () => setIndex((i) => (i + 1) % n);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setFormMsg(null);
    const sb = getSupabase();
    if (!sb) {
      setFormMsg({
        type: "err",
        text: "Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your .env file.",
      });
      return;
    }
    if (!name.trim() || !email.trim() || !body.trim()) {
      setFormMsg({ type: "err", text: "Please fill in your name, email, and review." });
      return;
    }
    if (rating < 1 || rating > 5) {
      setFormMsg({ type: "err", text: "Please choose a star rating from 1 to 5." });
      return;
    }
    if (file && file.size > MAX_BYTES) {
      setFormMsg({ type: "err", text: "Profile image must be 2 MB or smaller." });
      return;
    }

    setSubmitting(true);
    let profileUrl: string | null = null;

    try {
      if (file) {
        const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
        const safeExt = ["jpg", "jpeg", "png", "gif", "webp"].includes(ext)
          ? ext
          : "jpg";
        const path = `${crypto.randomUUID()}.${safeExt}`;
        const { error: upErr } = await sb.storage
          .from("review-avatars")
          .upload(path, file, { upsert: false, contentType: file.type || undefined });
        if (upErr) {
          setFormMsg({
            type: "err",
            text: "Could not upload image. Check the Storage bucket and policies in Supabase.",
          });
          setSubmitting(false);
          return;
        }
        const { data: pub } = sb.storage.from("review-avatars").getPublicUrl(path);
        profileUrl = pub.publicUrl;
      }

      const { error: insErr } = await sb.from("reviews").insert({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        rating,
        body: body.trim(),
        profile_image_url: profileUrl,
        status: "pending",
      });

      if (insErr) {
        setFormMsg({
          type: "err",
          text: insErr.message || "Could not submit review. Check database policies.",
        });
        setSubmitting(false);
        return;
      }

      notifyReviewSubmitted({
        name: name.trim(),
        email: email.trim(),
        rating,
        body_preview: body.trim().slice(0, 280),
      });

      setFormMsg({
        type: "ok",
        text: "Thanks! Your review was sent for approval. It will appear after you confirm it in Supabase.",
      });
      setName("");
      setEmail("");
      setBody("");
      setFile(null);
      setRating(5);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="reviews-section section-container" id="reviews">
      <p className="reviews-kicker">Reviews</p>
      <h2 className="reviews-title">What people say</h2>
      <p className="reviews-sub">
        Submissions are moderated: new reviews stay hidden until you approve them in your
        Supabase dashboard. Visitor emails are stored for you only and are not shown on the
        site.
      </p>

      {!configured && (
        <p className="reviews-config-hint">
          Add <code>VITE_SUPABASE_URL</code> and <code>VITE_SUPABASE_ANON_KEY</code> to a{" "}
          <code>.env</code> file, then follow <code>REVIEWS_SETUP.md</code> to create the
          table and storage bucket.
        </p>
      )}

      <div className="reviews-carousel-block">
        <div className="reviews-nav-row">
          <button
            type="button"
            className="reviews-nav-btn"
            onClick={prev}
            disabled={!canNav || loading}
            aria-label="Previous review"
          >
            <FaChevronLeft />
          </button>
          <button
            type="button"
            className="reviews-nav-btn"
            onClick={next}
            disabled={!canNav || loading}
            aria-label="Next review"
          >
            <FaChevronRight />
          </button>
        </div>

        {loading ? (
          <div className="reviews-glass reviews-empty">Loading reviews…</div>
        ) : n === 0 ? (
          <div className="reviews-glass reviews-empty">
            No published reviews yet. Approve submissions in Supabase, or be the first to
            leave one below.
          </div>
        ) : n === 1 ? (
          <div className="reviews-stage">
            <div className="reviews-card-wrap is-center" style={{ maxWidth: 420 }}>
              <ReviewCard
                review={reviews[0]}
                expanded={expandedId === reviews[0].id}
                onToggleExpand={() =>
                  setExpandedId((id) =>
                    id === reviews[0].id ? null : reviews[0].id
                  )
                }
              />
            </div>
          </div>
        ) : (
          <div className="reviews-stage">
            {(() => {
              const left = (index - 1 + n) % n;
              const right = (index + 1) % n;
              return (
                <>
                  <div className="reviews-card-wrap is-side">
                    <ReviewCard
                      review={reviews[left]}
                      expanded={expandedId === reviews[left].id}
                      onToggleExpand={() =>
                        setExpandedId((id) =>
                          id === reviews[left].id ? null : reviews[left].id
                        )
                      }
                      isCompact
                    />
                  </div>
                  <div className="reviews-card-wrap is-center">
                    <ReviewCard
                      review={reviews[index]}
                      expanded={expandedId === reviews[index].id}
                      onToggleExpand={() =>
                        setExpandedId((id) =>
                          id === reviews[index].id ? null : reviews[index].id
                        )
                      }
                    />
                  </div>
                  <div className="reviews-card-wrap is-side">
                    <ReviewCard
                      review={reviews[right]}
                      expanded={expandedId === reviews[right].id}
                      onToggleExpand={() =>
                        setExpandedId((id) =>
                          id === reviews[right].id ? null : reviews[right].id
                        )
                      }
                      isCompact
                    />
                  </div>
                </>
              );
            })()}
          </div>
        )}
      </div>

      <div className="reviews-glass">
        <h3 className="reviews-form-title">Leave a review</h3>
        <form className="reviews-form-grid" onSubmit={onSubmit} noValidate>
          <div>
            <label className="reviews-label" htmlFor="review-name">
              Name
            </label>
            <input
              id="review-name"
              className="reviews-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoComplete="name"
              required
              disabled={!configured || submitting}
            />
          </div>
          <div>
            <label className="reviews-label" htmlFor="review-email">
              Email
            </label>
            <input
              id="review-email"
              type="email"
              className="reviews-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
              disabled={!configured || submitting}
            />
          </div>
          <div className="reviews-field-full">
            <span className="reviews-label">Rating</span>
            <StarInput value={rating} onChange={setRating} />
          </div>
          <div className="reviews-field-full">
            <label className="reviews-label" htmlFor="review-avatar">
              Profile photo (optional)
            </label>
            <input
              id="review-avatar"
              type="file"
              accept="image/jpeg,image/png,image/gif,image/webp"
              className="reviews-input"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              disabled={!configured || submitting}
            />
            <p className="reviews-file-hint">Max 2 MB. JPG, PNG, GIF, or WebP.</p>
          </div>
          <div className="reviews-field-full">
            <label className="reviews-label" htmlFor="review-body">
              Your review
            </label>
            <textarea
              id="review-body"
              className="reviews-textarea"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              required
              rows={5}
              disabled={!configured || submitting}
            />
          </div>
          <div className="reviews-field-full">
            <button
              type="submit"
              className="reviews-submit"
              disabled={!configured || submitting}
            >
              {submitting ? "Sending…" : "Submit for approval"}
            </button>
            {formMsg && (
              <p
                className={`reviews-form-msg ${formMsg.type === "ok" ? "ok" : "err"}`}
                role="status"
              >
                {formMsg.text}
              </p>
            )}
          </div>
        </form>
      </div>
    </section>
  );
};

export default Reviews;
