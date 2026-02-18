import { useState, useEffect, useReducer, useCallback } from "react";
import "./App.css";

// ── Unsplash seed images (deterministic per post id) ──────────────────────────
const IMG_SEEDS = [
  "https://images.unsplash.com/photo-1506748686214-e9df14d4d9d0?w=400&q=60",
  "https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=400&q=60",
  "https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=400&q=60",
  "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=400&q=60",
  "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=400&q=60",
  "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=400&q=60",
];
const getImg = (id) => IMG_SEEDS[id % IMG_SEEDS.length];

// ── Redux-like reducer ────────────────────────────────────────────────────────
const initialState = {
  posts: [],
  removed: [],
  currentPage: 1,
  loading: true,
};

function reducer(state, action) {
  switch (action.type) {
    case "SET_POSTS":
      return { ...state, posts: action.payload, loading: false };
    case "REMOVE_POST":
      return { ...state, removed: [...state.removed, action.payload] };
    case "SET_PAGE":
      return { ...state, currentPage: action.payload };
    default:
      return state;
  }
}

const CARDS_PER_PAGE = 6;

export default function App() {
  const [state, dispatch] = useReducer(reducer, initialState);

  // Fetch posts after 5 sec loading
  useEffect(() => {
    const timer = setTimeout(async () => {
      try {
        const res = await fetch("https://jsonplaceholder.typicode.com/posts");
        const data = await res.json();
        dispatch({ type: "SET_POSTS", payload: data });
      } catch {
        dispatch({
          type: "SET_POSTS",
          payload: Array.from({ length: 20 }, (_, i) => ({
            id: i + 1,
            userId: 1,
            title: `Post title number ${i + 1}`,
            body: `This is the body of post ${i + 1}. It contains some placeholder text to fill the card.`,
          })),
        });
      }
    }, 5000);
    return () => clearTimeout(timer);
  }, []);

  const visiblePosts = state.posts.filter((p) => !state.removed.includes(p.id));
  const totalPages = Math.ceil(visiblePosts.length / CARDS_PER_PAGE);

  // If current page becomes empty after removal, go back one page
  useEffect(() => {
    if (state.currentPage > totalPages && totalPages > 0) {
      dispatch({ type: "SET_PAGE", payload: totalPages });
    }
  }, [visiblePosts.length, totalPages, state.currentPage]);

  const handleRemove = useCallback((id) => {
    dispatch({ type: "REMOVE_POST", payload: id });
  }, []);

  const handlePageChange = useCallback((page) => {
    dispatch({ type: "SET_PAGE", payload: page });
  }, []);

  const startIndex = (state.currentPage - 1) * CARDS_PER_PAGE;
  const pageCards = visiblePosts.slice(startIndex, startIndex + CARDS_PER_PAGE);

  const truncate = (str, len) =>
    str.length > len ? str.slice(0, len) + "..." : str;

  const maxShow = Math.min(totalPages, 10);
  const pageNums = Array.from({ length: maxShow }, (_, i) => i + 1);

  if (state.loading) {
    return (
      <div className="app">
        <div className="loading-container">
          <div className="spinner" />
          <div className="loading-text">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      <div className="header">
        <h1 className="title">Posts Explorer</h1>
        <p className="subtitle">
          {visiblePosts.length} posts · Page {state.currentPage} of {totalPages}
        </p>
      </div>

      {pageCards.length === 0 ? (
        <div className="empty-message">No more posts to display.</div>
      ) : (
        <div className="grid">
          {pageCards.map((post) => (
            <div key={post.id} className="card">
              <button
                className="remove-btn"
                onClick={() => handleRemove(post.id)}
                title="Remove card"
              >
                ✕
              </button>
              <div className="card-title">
                {truncate(
                  post.title.charAt(0).toUpperCase() + post.title.slice(1),
                  55
                )}
              </div>
              <div className="card-body">{truncate(post.body, 80)}</div>
              <div className="card-date">Mon, 21 Dec 2020 14:57 GMT</div>
              <img
                src={getImg(post.id)}
                alt="post thumbnail"
                className="card-img"
                loading="lazy"
              />
            </div>
          ))}
        </div>
      )}

      <div className="pagination">
        <button
          className="arrow-btn"
          onClick={() =>
            state.currentPage > 1 && handlePageChange(state.currentPage - 1)
          }
          disabled={state.currentPage === 1}
        >
          ‹
        </button>

        {pageNums.map((n) => (
          <button
            key={n}
            className={`page-btn ${n === state.currentPage ? "active" : ""}`}
            onClick={() => handlePageChange(n)}
          >
            {n}
          </button>
        ))}

        {totalPages > maxShow && <span className="ellipsis">…</span>}

        <button
          className="arrow-btn"
          onClick={() =>
            state.currentPage < totalPages &&
            handlePageChange(state.currentPage + 1)
          }
          disabled={state.currentPage === totalPages}
        >
          ›
        </button>
      </div>
    </div>
  );
}
