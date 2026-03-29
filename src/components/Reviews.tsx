import { useCallback, useEffect, useState, type FormEvent } from "react";
import { MdArrowBack, MdArrowForward } from "react-icons/md";
import { FaGlobe, FaStar, FaRegStar, FaCircleUser } from "react-icons/fa6";
import { getSupabase, isSupabaseConfigured } from "../lib/supabaseClient";
import { timeAgo } from "../lib/timeAgo";
import "./styles/Reviews.css";

const BODY_PREVIEW_LEN = 220;
const MAX_BYTES = 2 * 1024 * 1024;

type PublicReview = {
  id: string;
  created_at: string;
  name: string;
  profile_image_url: string | null;
  email_hash: string | null;
  rating: number;
  body: string;
  attachment_url: string | null;
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

async function notifyAdminEmailJS(payload: {
  name: string;
  email: string;
  rating: number;
  body_preview: string;
}) {
  const publicKey = import.meta.env.VITE_EMAILJS_PUBLIC_KEY?.trim();
  const serviceId = import.meta.env.VITE_EMAILJS_SERVICE_ID?.trim();
  const templateId = import.meta.env.VITE_EMAILJS_TEMPLATE_ID?.trim();
  if (!publicKey || !serviceId || !templateId) return;

  const tableUrl = import.meta.env.VITE_REVIEW_SUPABASE_TABLE_URL?.trim();
  const templateParams = {
    reviewer_name: payload.name,
    reviewer_email: payload.email,
    rating: String(payload.rating),
    review_preview: payload.body_preview,
    instructions: tableUrl
      ? `Moderate here: ${tableUrl}`
      : "Supabase → Table Editor → reviews → set status to approved (show on site) or rejected / delete (hide).",
  };

  try {
    const emailjs = await import("@emailjs/browser");
    await emailjs.send(serviceId, templateId, templateParams, { publicKey });
  } catch {
    /* ignore */
  }
}

function isUniqueViolation(err: { code?: string; message?: string } | null) {
  if (!err) return false;
  if (err.code === "23505") return true;
  const m = (err.message || "").toLowerCase();
  return m.includes("unique") || m.includes("duplicate");
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

function ReviewerAvatar({
  profile_image_url,
  email_hash,
  className = "",
}: {
  profile_image_url: string | null;
  email_hash: string | null;
  className?: string;
}) {
  const [gravatarFailed, setGravatarFailed] = useState(false);
  const cls = `reviews-avatar ${className}`.trim();

  if (profile_image_url) {
    return (
      <img className={cls} src={profile_image_url} alt="" loading="lazy" />
    );
  }

  if (email_hash && !gravatarFailed) {
    return (
      <img
        className={cls}
        src={`https://www.gravatar.com/avatar/${email_hash}?s=160&d=404`}
        alt=""
        loading="lazy"
        onError={() => setGravatarFailed(true)}
      />
    );
  }

  return (
    <div
      className={`reviews-avatar reviews-avatar-fallback reviews-avatar-person ${className}`.trim()}
      aria-hidden
    >
      <FaCircleUser />
    </div>
  );
}

function ReviewDesktopDetail({
  review,
  expanded,
  onToggleExpand,
}: {
  review: PublicReview;
  expanded: boolean;
  onToggleExpand: () => void;
}) {
  const long = review.body.length > BODY_PREVIEW_LEN;
  const shown =
    expanded || !long ? review.body : `${review.body.slice(0, BODY_PREVIEW_LEN)}…`;

  return (
    <article className="reviews-d-card reviews-glass">
      <div className="reviews-d-visual">
        {review.attachment_url ? (
          <img
            className="reviews-d-attachment"
            src={review.attachment_url}
            alt=""
            loading="lazy"
          />
        ) : (
          <div className="reviews-d-avatar-frame">
            <ReviewerAvatar
              profile_image_url={review.profile_image_url}
              email_hash={review.email_hash}
              className="reviews-d-avatar-lg"
            />
          </div>
        )}
      </div>
      <div className="reviews-d-copy">
        <h3 className="reviews-d-name">{review.name}</h3>
        <StarsDisplay rating={review.rating} />
        <div
          className={`reviews-c-body-panel reviews-d-body-panel ${expanded ? "is-expanded" : ""}`}
        >
          <p className="reviews-card-body reviews-c-body">{shown}</p>
          {long && (
            <button
              type="button"
              className="reviews-show-more reviews-show-more--panel"
              onClick={onToggleExpand}
            >
              {expanded ? "Show less" : "Show more"}
            </button>
          )}
        </div>
        <div className="reviews-card-footer reviews-d-footer">
          <span className="reviews-footer-source">
            <FaGlobe aria-hidden />
            Portfolio review
          </span>
          <time dateTime={review.created_at}>{timeAgo(review.created_at)}</time>
        </div>
      </div>
    </article>
  );
}

function ReviewSlide({
  review,
  slideIndex,
  expanded,
  onToggleExpand,
  isSide = false,
}: {
  review: PublicReview;
  slideIndex: number;
  expanded: boolean;
  onToggleExpand: () => void;
  isSide?: boolean;
}) {
  const previewLen = isSide ? 96 : BODY_PREVIEW_LEN;
  const long = review.body.length > previewLen;
  const shown = isSide
    ? long
      ? `${review.body.slice(0, previewLen)}…`
      : review.body
    : expanded || !long
      ? review.body
      : `${review.body.slice(0, previewLen)}…`;

  return (
    <div className={`reviews-c-slide ${isSide ? "reviews-c-slide--side" : ""}`}>
      <div
        className={`reviews-glass reviews-c-content ${isSide ? "reviews-c-content--side" : ""}`}
      >
        <div className="reviews-c-info">
          {!isSide && (
            <div className="reviews-c-number">
              <h3>{String(slideIndex + 1).padStart(2, "0")}</h3>
            </div>
          )}
          <div className="reviews-c-details">
            <div className="reviews-c-header-row">
              <ReviewerAvatar
                profile_image_url={review.profile_image_url}
                email_hash={review.email_hash}
              />
              <div>
                <h4 className="reviews-card-name">{review.name}</h4>
                <StarsDisplay rating={review.rating} />
              </div>
            </div>
            {isSide ? (
              <p className="reviews-card-body reviews-c-body">{shown}</p>
            ) : (
              <div
                className={`reviews-c-body-panel ${expanded ? "is-expanded" : ""}`}
              >
                <p className="reviews-card-body reviews-c-body">{shown}</p>
                {long && (
                  <button
                    type="button"
                    className="reviews-show-more reviews-show-more--panel"
                    onClick={onToggleExpand}
                  >
                    {expanded ? "Show less" : "Show more"}
                  </button>
                )}
              </div>
            )}
            <div className="reviews-card-footer reviews-c-footer">
              <span className="reviews-footer-source">
                <FaGlobe aria-hidden />
                Portfolio review
              </span>
              <time dateTime={review.created_at}>{timeAgo(review.created_at)}</time>
            </div>
          </div>
        </div>
        <div className="reviews-c-image-wrap">
          {review.attachment_url ? (
            <img
              className="reviews-c-attachment"
              src={review.attachment_url}
              alt=""
              loading="lazy"
            />
          ) : (
            <div className="reviews-c-image-placeholder">
              <span>Preview</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const Reviews = () => {
  const configured = isSupabaseConfigured();
  const [reviews, setReviews] = useState<PublicReview[]>([]);
  const [loading, setLoading] = useState(configured);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [rating, setRating] = useState(5);
  const [body, setBody] = useState("");
  const [profileFile, setProfileFile] = useState<File | null>(null);
  const [attachmentFile, setAttachmentFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formMsg, setFormMsg] = useState<{ type: "ok" | "err"; text: string } | null>(
    null
  );

  const n = reviews.length;

  const loadReviews = useCallback(async () => {
    const sb = getSupabase();
    if (!sb) {
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data, error } = await sb
      .from("reviews")
      .select(
        "id, created_at, name, profile_image_url, email_hash, rating, body, attachment_url"
      )
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
    setCurrentIndex(0);
    setExpandedId(null);
  }, [n]);

  useEffect(() => {
    setExpandedId(null);
  }, [currentIndex]);

  const goToSlide = useCallback(
    (index: number) => {
      if (isAnimating || n === 0) return;
      setIsAnimating(true);
      setCurrentIndex(index);
      setTimeout(() => setIsAnimating(false), 500);
    },
    [isAnimating, n]
  );

  const goToPrev = useCallback(() => {
    const next = currentIndex === 0 ? n - 1 : currentIndex - 1;
    goToSlide(next);
  }, [currentIndex, n, goToSlide]);

  const goToNext = useCallback(() => {
    const next = currentIndex === n - 1 ? 0 : currentIndex + 1;
    goToSlide(next);
  }, [currentIndex, n, goToSlide]);

  async function uploadToBucket(
    sb: NonNullable<ReturnType<typeof getSupabase>>,
    bucket: string,
    file: File
  ): Promise<string | null> {
    const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const safeExt = ["jpg", "jpeg", "png", "gif", "webp"].includes(ext) ? ext : "jpg";
    const path = `${crypto.randomUUID()}.${safeExt}`;
    const { error: upErr } = await sb.storage
      .from(bucket)
      .upload(path, file, { upsert: false, contentType: file.type || undefined });
    if (upErr) return null;
    const { data: pub } = sb.storage.from(bucket).getPublicUrl(path);
    return pub.publicUrl;
  }

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
    if (profileFile && profileFile.size > MAX_BYTES) {
      setFormMsg({ type: "err", text: "Profile image must be 2 MB or smaller." });
      return;
    }
    if (attachmentFile && attachmentFile.size > MAX_BYTES) {
      setFormMsg({ type: "err", text: "Screenshot must be 2 MB or smaller." });
      return;
    }

    setSubmitting(true);
    let profileUrl: string | null = null;
    let attachmentUrl: string | null = null;

    try {
      if (profileFile) {
        const url = await uploadToBucket(sb, "review-avatars", profileFile);
        if (!url) {
          setFormMsg({
            type: "err",
            text: "Could not upload profile photo. Check Storage in Supabase.",
          });
          setSubmitting(false);
          return;
        }
        profileUrl = url;
      }

      if (attachmentFile) {
        const url = await uploadToBucket(sb, "review-attachments", attachmentFile);
        if (!url) {
          setFormMsg({
            type: "err",
            text: "Could not upload screenshot. Run migration 002 and check bucket review-attachments.",
          });
          setSubmitting(false);
          return;
        }
        attachmentUrl = url;
      }

      const insertPayload: Record<string, unknown> = {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        rating,
        body: body.trim(),
        profile_image_url: profileUrl,
        status: "pending",
      };
      if (attachmentUrl) insertPayload.attachment_url = attachmentUrl;

      const { error: insErr } = await sb.from("reviews").insert(insertPayload);

      if (insErr) {
        if (isUniqueViolation(insErr)) {
          setFormMsg({
            type: "err",
            text: "This email has already been used for a review. Each address can submit once.",
          });
        } else {
          setFormMsg({
            type: "err",
            text:
              insErr.message ||
              "Could not submit review. Check database policies and run supabase/migrations/002_reviews_enhancements.sql if needed.",
          });
        }
        setSubmitting(false);
        return;
      }

      notifyReviewSubmitted({
        name: name.trim(),
        email: email.trim(),
        rating,
        body_preview: body.trim().slice(0, 280),
      });
      void notifyAdminEmailJS({
        name: name.trim(),
        email: email.trim(),
        rating,
        body_preview: body.trim().slice(0, 280),
      });

      setFormMsg({
        type: "ok",
        text: "Your review has been submitted. Thank you for your time — it should appear here within about 30 minutes.",
      });
      setName("");
      setEmail("");
      setBody("");
      setProfileFile(null);
      setAttachmentFile(null);
      setRating(5);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="reviews-section section-container" id="reviews">
      <p className="reviews-kicker">Reviews</p>
      <h2 className="reviews-title">
        What <span className="reviews-title-accent">people</span> say
      </h2>
      <p className="reviews-sub">
        Short notes and previews from people I&apos;ve worked with — submitted reviews show up
        here after a quick check.
      </p>

      {!configured && (
        <p className="reviews-config-hint">
          Add <code>VITE_SUPABASE_URL</code> and <code>VITE_SUPABASE_ANON_KEY</code> to a{" "}
          <code>.env</code> file, then follow <code>REVIEWS_SETUP.md</code>.
        </p>
      )}

      {loading ? (
        <div className="reviews-c-wrapper">
          <div className="reviews-glass reviews-empty reviews-c-empty-box">Loading reviews…</div>
        </div>
      ) : n === 0 ? (
        <div className="reviews-c-wrapper">
          <div className="reviews-glass reviews-empty reviews-c-empty-box">
            No reviews here yet. Be the first to share feedback using the form below.
          </div>
        </div>
      ) : (
        <>
          {/* Desktop: reviewer tabs + one large detail card (reference layout) */}
          <div className="reviews-c-wrapper reviews-c-wrapper--desktop">
            {n > 1 && (
              <div className="reviews-d-tabs">
                <div className="reviews-d-tabs-scroll" role="tablist" aria-label="Reviews">
                  {reviews.map((r, i) => (
                    <button
                      key={r.id}
                      type="button"
                      role="tab"
                      aria-selected={i === currentIndex}
                      className={`reviews-d-tab ${i === currentIndex ? "is-active" : ""}`}
                      onClick={() => goToSlide(i)}
                      data-cursor="disable"
                    >
                      <ReviewerAvatar
                        profile_image_url={r.profile_image_url}
                        email_hash={r.email_hash}
                        className="reviews-avatar--tab"
                      />
                      <span className="reviews-d-tab-name">{r.name}</span>
                    </button>
                  ))}
                </div>
                <div className="reviews-d-tabs-arrows">
                  <button
                    type="button"
                    className="reviews-c-arrow"
                    onClick={goToPrev}
                    aria-label="Previous review"
                    data-cursor="disable"
                  >
                    <MdArrowBack />
                  </button>
                  <button
                    type="button"
                    className="reviews-c-arrow"
                    onClick={goToNext}
                    aria-label="Next review"
                    data-cursor="disable"
                  >
                    <MdArrowForward />
                  </button>
                </div>
              </div>
            )}
            <ReviewDesktopDetail
              review={reviews[currentIndex]}
              expanded={expandedId === reviews[currentIndex].id}
              onToggleExpand={() =>
                setExpandedId((id) =>
                  id === reviews[currentIndex].id ? null : reviews[currentIndex].id
                )
              }
            />
          </div>

          {/* Mobile: carousel (kept from before) */}
          <div
            className={`reviews-c-wrapper reviews-c-wrapper--mobile ${n > 1 ? "reviews-c-wrapper--peek" : ""}`}
          >
            {n > 1 && (
              <div className="reviews-c-nav-row">
                <button
                  type="button"
                  className="reviews-c-arrow"
                  onClick={goToPrev}
                  disabled={loading}
                  aria-label="Previous review"
                  data-cursor="disable"
                >
                  <MdArrowBack />
                </button>
                <button
                  type="button"
                  className="reviews-c-arrow"
                  onClick={goToNext}
                  disabled={loading}
                  aria-label="Next review"
                  data-cursor="disable"
                >
                  <MdArrowForward />
                </button>
              </div>
            )}

            {n === 1 ? (
              <div className="reviews-single-wrap">
                <ReviewSlide
                  review={reviews[0]}
                  slideIndex={0}
                  expanded={expandedId === reviews[0].id}
                  onToggleExpand={() =>
                    setExpandedId((id) => (id === reviews[0].id ? null : reviews[0].id))
                  }
                />
              </div>
            ) : (
              <>
                <div className="reviews-peek-stage">
                  <div className="reviews-peek-col is-side">
                    <ReviewSlide
                      review={reviews[(currentIndex - 1 + n) % n]}
                      slideIndex={(currentIndex - 1 + n) % n}
                      expanded={false}
                      onToggleExpand={() => {}}
                      isSide
                    />
                  </div>
                  <div className="reviews-peek-col is-center">
                    <ReviewSlide
                      review={reviews[currentIndex]}
                      slideIndex={currentIndex}
                      expanded={expandedId === reviews[currentIndex].id}
                      onToggleExpand={() =>
                        setExpandedId((id) =>
                          id === reviews[currentIndex].id ? null : reviews[currentIndex].id
                        )
                      }
                    />
                  </div>
                  <div className="reviews-peek-col is-side">
                    <ReviewSlide
                      review={reviews[(currentIndex + 1) % n]}
                      slideIndex={(currentIndex + 1) % n}
                      expanded={false}
                      onToggleExpand={() => {}}
                      isSide
                    />
                  </div>
                </div>

                <div className="reviews-c-dots">
                  {reviews.map((r, index) => (
                    <button
                      type="button"
                      key={r.id}
                      className={`reviews-c-dot ${index === currentIndex ? "reviews-c-dot-active" : ""}`}
                      onClick={() => goToSlide(index)}
                      aria-label={`Go to review ${index + 1}`}
                      data-cursor="disable"
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        </>
      )}

      <div className="reviews-glass reviews-form-glass">
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
            <p className="reviews-file-hint">One review per email address.</p>
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
              onChange={(e) => setProfileFile(e.target.files?.[0] ?? null)}
              disabled={!configured || submitting}
            />
            <p className="reviews-file-hint">
              If you skip this, we use your Gravatar for that email when available; otherwise a
              default icon. Max 2 MB.
            </p>
          </div>
          <div className="reviews-field-full">
            <label className="reviews-label" htmlFor="review-screenshot">
              Screenshot (optional)
            </label>
            <input
              id="review-screenshot"
              type="file"
              accept="image/jpeg,image/png,image/gif,image/webp"
              className="reviews-input"
              onChange={(e) => setAttachmentFile(e.target.files?.[0] ?? null)}
              disabled={!configured || submitting}
            />
            <p className="reviews-file-hint">
              e.g. website or app screen — shows on the right in the review slider. Max 2 MB.
            </p>
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
              {submitting ? "Sending…" : "Submit review"}
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
