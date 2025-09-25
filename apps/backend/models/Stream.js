const { supabase } = require('../lib/supabase');
const MuxService = require('../lib/mux');

class Stream {
  // Create new stream
  static async create(streamData, adminId) {
    try {
      console.log('🎬 Creating Mux live stream:', streamData.name);
      
      // Validate Mux configuration before attempting to create stream
      MuxService.validateConfig();
      
      // Create Mux live stream
      const muxStream = await MuxService.createLiveStream(streamData.name);
      console.log('✅ Mux live stream created successfully:', muxStream.id);

      // Store in database
      const { data, error } = await supabase
        .from('streams')
        .insert({
          name: streamData.name,
          hamster_name: streamData.hamsterName,
          description: streamData.description,
          mux_playback_id: muxStream.playbackId,
          mux_stream_key: muxStream.streamKey,
          mux_stream_id: muxStream.id, // Store the actual Mux Stream ID
          assigned_admin_id: adminId,
          is_active: true,
        })
        .select()
        .single();

      if (error) throw error;

      console.log('💾 Stream saved to database:', data.id);

      return {
        ...data,
        rtmpUrl: muxStream.rtmpUrl,
        muxStreamId: muxStream.id,
      };
    } catch (error) {
      console.error('Error creating stream:', error);
      throw error;
    }
  }

  // Get all active streams
  static async getAllActive() {
    try {
      const { data, error } = await supabase
        .from('streams')
        .select(`
          *,
          users!assigned_admin_id (
            username,
            email
          )
        `)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching active streams:', error);
      throw error;
    }
  }

  // Get streams available for admin assignment
  static async getAvailableForAssignment() {
    try {
      const { data, error } = await supabase
        .from('streams')
        .select('*')
        .eq('is_active', true)
        .is('assigned_admin_id', null)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching available streams:', error);
      throw error;
    }
  }

  // Assign admin to stream
  static async assignAdmin(streamId, adminId, superAdminId = null) {
    try {
      // Check if stream is already assigned (unless super admin override)
      const stream = await this.getById(streamId);
      if (!stream) throw new Error('Stream not found');

      if (stream.assigned_admin_id && !superAdminId) {
        throw new Error('Stream already assigned to another admin');
      }

      const { data, error } = await supabase
        .from('streams')
        .update({
          assigned_admin_id: adminId,
          updated_at: new Date().toISOString(),
        })
        .eq('id', streamId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error assigning admin to stream:', error);
      throw error;
    }
  }

  // Unassign admin from stream
  static async unassignAdmin(streamId, requestingAdminId) {
    try {
      const { data, error } = await supabase
        .from('streams')
        .update({
          assigned_admin_id: null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', streamId)
        .eq('assigned_admin_id', requestingAdminId) // Only current admin can unassign
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error unassigning admin from stream:', error);
      throw error;
    }
  }

  // Get stream by ID
  static async getById(streamId) {
    try {
      const { data, error } = await supabase
        .from('streams')
        .select(`
          *,
          users!assigned_admin_id (
            username,
            email
          )
        `)
        .eq('id', streamId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data;
    } catch (error) {
      console.error('Error fetching stream:', error);
      throw error;
    }
  }

  // Get streams assigned to admin
  static async getByAdminId(adminId) {
    try {
      const { data, error } = await supabase
        .from('streams')
        .select('*')
        .eq('assigned_admin_id', adminId)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Add calculated fields for admin view
      return data.map(stream => ({
        ...stream,
        rtmpUrl: `rtmps://global-live.mux.com:443/app`,
        muxStreamId: stream.mux_stream_id || 'Not available',
      }));
    } catch (error) {
      console.error('Error fetching admin streams:', error);
      throw error;
    }
  }

  // Update stream info
  static async update(streamId, updates, adminId) {
    try {
      const { data, error } = await supabase
        .from('streams')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', streamId)
        .eq('assigned_admin_id', adminId) // Only assigned admin can update
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating stream:', error);
      throw error;
    }
  }

  // Deactivate stream
  static async deactivate(streamId, adminId) {
    try {
      const { data, error } = await supabase
        .from('streams')
        .update({
          is_active: false,
          assigned_admin_id: null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', streamId)
        .eq('assigned_admin_id', adminId)
        .select()
        .single();

      if (error) throw error;

      // TODO: Also delete the Mux stream if needed
      // await MuxService.deleteStream(stream.mux_stream_id);

      return data;
    } catch (error) {
      console.error('Error deactivating stream:', error);
      throw error;
    }
  }

  // Update viewer count
  static async updateViewerCount(streamId, count) {
    try {
      const { data, error } = await supabase
        .from('streams')
        .update({
          viewer_count: count,
          updated_at: new Date().toISOString(),
        })
        .eq('id', streamId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating viewer count:', error);
      throw error;
    }
  }

  // Get stream with markets (includes all markets, not just active ones)
  static async getWithActiveMarkets(streamId) {
    try {
      // First get the stream
      const { data: stream, error: streamError } = await supabase
        .from('streams')
        .select('*')
        .eq('id', streamId)
        .single();

      if (streamError) {
        if (streamError.code === 'PGRST116') {
          return null; // Stream not found
        }
        throw streamError;
      }

      // Then get all markets for this stream (not just active ones)
      const { data: markets, error: marketsError } = await supabase
        .from('markets')
        .select(`
          id,
          question,
          ends_at,
          total_volume,
          yes_volume,
          no_volume,
          status
        `)
        .eq('stream_id', streamId)
        .order('created_at', { ascending: false });

      if (marketsError) {
        console.warn('Error fetching markets for stream:', marketsError);
        // Still return stream even if markets fetch fails
        return { ...stream, markets: [] };
      }

      return { ...stream, markets: markets || [] };
    } catch (error) {
      console.error('Error fetching stream with markets:', error);
      throw error;
    }
  }
}

module.exports = Stream;
