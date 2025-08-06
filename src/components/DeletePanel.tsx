import React, { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client"; // Adjust path if needed

type Client = { id: number; [key: string]: any };
type Video = { id: number; [key: string]: any };
type Group = { id: number; [key: string]: any };

export default function DeletePanel() {
  const [clients, setClients] = useState<Client[]>([]);
  const [videos, setVideos] = useState<Video[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(false);

  // Fetch all data on mount
  useEffect(() => {
    fetchAll();
  }, []);

  async function fetchAll() {
    setLoading(true);
    const [clientsRes, videosRes, groupsRes] = await Promise.all([
      supabase.from("clients").select("*"),
      supabase.from("videos").select("*"),
      supabase.from("groups").select("*"),
    ]);
    setClients(clientsRes.data || []);
    setVideos(videosRes.data || []);
    setGroups(groupsRes.data || []);
    setLoading(false);
  }

  async function handleDelete(table: "clients" | "videos" | "groups", id: number) {
    setLoading(true);
    await supabase.from(table).delete().eq("id", id);
    await fetchAll();
    setLoading(false);
  }

  return (
    <div style={{ maxWidth: 600, margin: "2rem auto", padding: 24 }}>
      <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 24 }}>Delete Panel (Admin Only)</h1>
      
      {loading && <div>Loading...</div>}

      {/* Clients */}
      <section style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: 22, fontWeight: 600 }}>Clients</h2>
        {clients.length === 0 ? (
          <div>No clients found.</div>
        ) : (
          clients.map(client => (
            <div key={client.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #eee", padding: "8px 0" }}>
              <span>{client.name || JSON.stringify(client)}</span>
              <button
                style={{ background: "#e11d48", color: "white", border: "none", borderRadius: 4, padding: "4px 12px", cursor: "pointer" }}
                onClick={() => handleDelete("clients", client.id)}
                disabled={loading}
              >
                Delete
              </button>
            </div>
          ))
        )}
      </section>

      {/* Videos */}
      <section style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: 22, fontWeight: 600 }}>Videos</h2>
        {videos.length === 0 ? (
          <div>No videos found.</div>
        ) : (
          videos.map(video => (
            <div key={video.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #eee", padding: "8px 0" }}>
              <span>{video.title || video.name || JSON.stringify(video)}</span>
              <button
                style={{ background: "#e11d48", color: "white", border: "none", borderRadius: 4, padding: "4px 12px", cursor: "pointer" }}
                onClick={() => handleDelete("videos", video.id)}
                disabled={loading}
              >
                Delete
              </button>
            </div>
          ))
        )}
      </section>

      {/* Groups */}
      <section>
        <h2 style={{ fontSize: 22, fontWeight: 600 }}>Groups</h2>
        {groups.length === 0 ? (
          <div>No groups found.</div>
        ) : (
          groups.map(group => (
            <div key={group.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #eee", padding: "8px 0" }}>
              <span>{group.name || JSON.stringify(group)}</span>
              <button
                style={{ background: "#e11d48", color: "white", border: "none", borderRadius: 4, padding: "4px 12px", cursor: "pointer" }}
                onClick={() => handleDelete("groups", group.id)}
                disabled={loading}
              >
                Delete
              </button>
            </div>
          ))
        )}
      </section>
    </div>
  );
}
