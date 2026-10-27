export default function Header({ isMock }) {
  return (
    <header className="header">
      <div>
        <h1 className="brand">Heritage Map</h1>
        <p className="tagline">Bringing India's forgotten heritage back to life</p>
      </div>
      {isMock && <span className="demo-pill">Demo mode</span>}
    </header>
  )
}
