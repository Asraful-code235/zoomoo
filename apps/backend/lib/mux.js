const Mux = require('@mux/mux-node');

// Initialize Mux client
const muxClient = new Mux({
  tokenId: process.env.MUX_TOKEN_ID,
  tokenSecret: process.env.MUX_TOKEN_SECRET,
});

// Get Video and Live stream clients
const { video: Video, data: Data } = muxClient;

class MuxService {
  // Create a new live stream
  static async createLiveStream(streamName) {
    try {
      const stream = await Video.liveStreams.create({
        playback_policy: ['public'],
        new_asset_settings: {
          playback_policy: ['public'],
        },
        reconnect_window: 30, // seconds - faster reconnection
        max_continuous_duration: 43200, // 12 hours max
        latency_mode: 'reduced', // ultra low latency for real-time betting
        test: false, // Always create real streams since we have a paid plan
      });

      return {
        id: stream.id,
        streamKey: stream.stream_key,
        playbackId: stream.playback_ids[0]?.id,
        status: stream.status,
        rtmpUrl: `rtmps://global-live.mux.com:443/app`,
      };
    } catch (error) {
      console.error('Error creating Mux live stream:', error);
      throw error;
    }
  }

  // Get live stream status
  static async getStreamStatus(streamId) {
    try {
      const stream = await Video.liveStreams.retrieve(streamId);
      return {
        id: stream.id,
        status: stream.status,
        isActive: stream.status === 'active',
        reconnectWindow: stream.reconnect_window,
        recentAssets: stream.recent_asset_ids || [],
      };
    } catch (error) {
      console.error('Error getting stream status:', error);
      throw error;
    }
  }

  // Delete live stream
  static async deleteStream(streamId) {
    try {
      await Video.liveStreams.delete(streamId);
      return { success: true };
    } catch (error) {
      console.error('Error deleting stream:', error);
      throw error;
    }
  }

  // Reset stream key (if compromised)
  static async resetStreamKey(streamId) {
    try {
      const stream = await Video.liveStreams.resetStreamKey(streamId);
      return {
        id: stream.id,
        streamKey: stream.stream_key,
        rtmpUrl: `rtmps://global-live.mux.com:443/app`,
      };
    } catch (error) {
      console.error('Error resetting stream key:', error);
      throw error;
    }
  }

  // Get stream metrics
  static async getStreamMetrics(streamId) {
    try {
      // Get viewing data
      const metrics = await Data.metrics.breakdown('video_startup_time', {
        filters: [`live_stream_id:${streamId}`],
        timeframe: ['7:days'],
      });

      return {
        streamId,
        metrics: metrics.data || [],
        totalViews: metrics.total_row_count || 0,
      };
    } catch (error) {
      console.error('Error getting stream metrics:', error);
      return { streamId, metrics: [], totalViews: 0 };
    }
  }

  // Get all live streams
  static async getAllStreams() {
    try {
      const streams = await Video.liveStreams.list();
      return streams.data.map(stream => ({
        id: stream.id,
        status: stream.status,
        playbackId: stream.playback_ids[0]?.id,
        createdAt: stream.created_at,
        isActive: stream.status === 'active',
      }));
    } catch (error) {
      console.error('Error getting all streams:', error);
      throw error;
    }
  }

  // Create simulcast target (for multi-platform streaming)
  static async createSimulcastTarget(streamId, url, streamKey) {
    try {
      const target = await Video.liveStreams.createSimulcastTarget(streamId, {
        url,
        stream_key: streamKey,
        passthrough: 'optional-metadata',
      });

      return {
        id: target.id,
        url: target.url,
        status: target.status,
      };
    } catch (error) {
      console.error('Error creating simulcast target:', error);
      throw error;
    }
  }

  // Validate environment variables
  static validateConfig() {
    if (!process.env.MUX_TOKEN_ID || !process.env.MUX_TOKEN_SECRET) {
      throw new Error('Missing Mux configuration! Please set MUX_TOKEN_ID and MUX_TOKEN_SECRET');
    }
    console.log('✅ Mux configuration validated successfully');
    return true;
  }
}

module.exports = MuxService;
