export default function RoomPage({ params }: { params: { roomCode: string } }) {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-2xl shadow-xl max-w-sm w-full text-center space-y-4 border border-gray-100">
        <h1 className="text-2xl font-bold text-gray-900">Welcome to Room</h1>
        <div className="bg-indigo-50 border border-indigo-100 text-indigo-700 py-3 px-6 rounded-xl font-mono text-3xl font-bold tracking-widest inline-block mx-auto">
          {params.roomCode}
        </div>
        <p className="text-gray-500">Wait till we implement the participant join form!</p>
      </div>
    </div>
  )
}