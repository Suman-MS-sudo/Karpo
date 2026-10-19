export function MapEmbed({ location, title = "Location" }: { location: string; title?: string }) {
  if (!location.trim()) return null
  const q = encodeURIComponent(location)
  return (
    <div className="rounded-xl overflow-hidden border border-border h-[200px] w-full mt-2">
      <iframe
        title={title}
        src={`https://maps.google.com/maps?q=${q}&output=embed&z=15`}
        width="100%"
        height="100%"
        style={{ border: 0 }}
        allowFullScreen
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
      />
    </div>
  )
}
